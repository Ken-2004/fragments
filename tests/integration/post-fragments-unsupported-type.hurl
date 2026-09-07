# Unsupported Content-Type Test
POST http://localhost:8080/v1/fragments
Content-Type: application/pdf
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`This type is not supported`

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" isString
