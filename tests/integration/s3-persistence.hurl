# S3 fragment data persistence integration test

# 1. Create a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Hello S3!`

# 2. Confirm creation and capture the Location header
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
url: header "Location"

# 3. Retrieve the fragment from S3
GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 4. Confirm the fragment data
HTTP/1.1 200
Content-Type: text/plain
Content-Length: 9
[Asserts]
body == "Hello S3!"

# 5. Delete the fragment
DELETE {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 6. Confirm deletion succeeded
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 7. Try to retrieve the deleted fragment
GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 8. Confirm it no longer exists
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
