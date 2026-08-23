import { LexiconError } from '../errors';
import { isEscaped } from './template-syntax';

const IF_OPEN = '[逻辑.判断]';
const ELSE_IF = '[逻辑.否则判断]';
const ELSE = '[逻辑.否则]';
const IF_END = '[逻辑.判断.结束]';

export interface ConditionalBranch {
  condition?: string;
  content: string;
}

export interface ConditionalBlockLocation {
  start: number;
  end: number;
  source: string;
}

export function findConditionalBlock(input: string): ConditionalBlockLocation | undefined {
  let depth = 0;
  let start = -1;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== '[' || isEscaped(input, index)) {
      continue;
    }
    if (input.startsWith(IF_OPEN, index)) {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      index += IF_OPEN.length - 1;
      continue;
    }
    if (input.startsWith(IF_END, index)) {
      if (depth === 0) {
        throw new LexiconError('逻辑条件存在未配对的结束标记。');
      }
      depth -= 1;
      const end = index + IF_END.length - 1;
      if (depth === 0) {
        return { start, end, source: input.slice(start, end + 1) };
      }
      index = end;
      continue;
    }
    if (depth === 0 && (input.startsWith(ELSE_IF, index) || input.startsWith(ELSE, index))) {
      throw new LexiconError('逻辑条件分支缺少对应的 [逻辑.判断]。');
    }
  }

  if (depth > 0) {
    throw new LexiconError('逻辑条件缺少 [逻辑.判断.结束]。');
  }
  return undefined;
}

export function parseConditionalBlock(source: string): ConditionalBranch[] {
  if (!source.startsWith(IF_OPEN) || !source.endsWith(IF_END)) {
    throw new LexiconError('逻辑条件块格式不完整。');
  }
  const body = source.slice(IF_OPEN.length, -IF_END.length);
  const sections: Array<{ kind: 'if' | 'elseIf' | 'else'; content: string }> = [];
  let kind: 'if' | 'elseIf' | 'else' = 'if';
  let sectionStart = 0;
  let depth = 0;
  let hasElse = false;

  for (let index = 0; index < body.length; index += 1) {
    if (body[index] !== '[' || isEscaped(body, index)) {
      continue;
    }
    if (body.startsWith(IF_OPEN, index)) {
      depth += 1;
      index += IF_OPEN.length - 1;
      continue;
    }
    if (body.startsWith(IF_END, index)) {
      if (depth === 0) {
        throw new LexiconError('逻辑条件存在未配对的结束标记。');
      }
      depth -= 1;
      index += IF_END.length - 1;
      continue;
    }
    if (depth !== 0) {
      continue;
    }

    const nextKind = body.startsWith(ELSE_IF, index) ? 'elseIf' : body.startsWith(ELSE, index) ? 'else' : undefined;
    if (!nextKind) {
      continue;
    }
    if (hasElse) {
      throw new LexiconError('[逻辑.否则] 后不能继续添加条件分支。');
    }
    sections.push({ kind, content: body.slice(sectionStart, index) });
    kind = nextKind;
    hasElse = nextKind === 'else';
    const markerLength = nextKind === 'elseIf' ? ELSE_IF.length : ELSE.length;
    sectionStart = index + markerLength;
    index += markerLength - 1;
  }
  sections.push({ kind, content: body.slice(sectionStart) });

  return sections.map((section) => {
    if (section.kind === 'else') {
      return { content: section.content };
    }
    return parseConditionBranch(section.content);
  });
}

function parseConditionBranch(content: string): ConditionalBranch {
  const conditionStart = content.search(/\S/u);
  if (conditionStart < 0 || content[conditionStart] !== '[') {
    throw new LexiconError('[逻辑.判断] 和 [逻辑.否则判断] 后必须紧跟逻辑条件词条。');
  }
  const conditionEnd = findTermEnd(content, conditionStart);
  const condition = content.slice(conditionStart, conditionEnd + 1);
  if (!/^\[逻辑\.(?:or|and|in|等于|不等于)\./u.test(condition)) {
    throw new LexiconError('条件必须使用 [逻辑.or]、[逻辑.and]、[逻辑.in]、[逻辑.等于] 或 [逻辑.不等于]。');
  }
  return { condition, content: content.slice(conditionEnd + 1) };
}

function findTermEnd(input: string, start: number): number {
  let depth = 0;
  for (let index = start; index < input.length; index += 1) {
    if (isEscaped(input, index)) {
      continue;
    }
    if (input[index] === '[') {
      depth += 1;
    } else if (input[index] === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  throw new LexiconError('逻辑条件词条缺少右方括号。');
}
