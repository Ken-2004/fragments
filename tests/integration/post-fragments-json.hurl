# JSON Fragment Test
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
test-user1@fragments-testing.com:test-password1
{
  "service": "inventory",
  "revision": 8,
  "status": "working"
}

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
[Captures]
url: header "Location"

GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.service" == "inventory"
jsonpath "$.revision" == 8
jsonpath "$.status" == "working"
