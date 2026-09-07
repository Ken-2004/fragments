# Content-Type Charset Test
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`This is a UTF-8 fragment`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
jsonpath "$.fragment.size" == 24
[Captures]
url: header "Location"

GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 24
[Asserts]
body == "This is a UTF-8 fragment"
