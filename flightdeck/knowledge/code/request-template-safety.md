# 网络请求词条安全边界
SUMMARY: 网络请求词条只允许公网 HTTP/HTTPS，必须限制方法、JSON 参数、响应大小、重定向和超时时间，并在 DNS 解析后再次拦截私网地址。
READ WHEN: before modifying network request template parsing, request execution, URL validation, or request timeout behavior

---

- 请求词条在回答模板中执行，问题模板保持字面不执行。
- 超时时间写在词条末尾的 `超时时间=秒`，默认 10 秒，限制为不超过 300 秒。
- GET/HEAD 将 JSON 参数编码到查询串，其余方法将 JSON 参数作为请求体；请求头只能包含字符串、数字或布尔值。
- 禁止用户名密码、重定向、本机、私网、链路本地和组播地址；域名需要 DNS 解析并检查全部结果。
- 响应正文限制为 1 MiB，非 2xx、网络错误和超时返回明确词条错误。
