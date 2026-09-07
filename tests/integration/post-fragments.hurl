# tests/integration/post-fragments.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`This is a fragment!`

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings.
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: text/plain
Content-Length: 19
[Asserts]
body == "This is a fragment!"
