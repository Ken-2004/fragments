# DynamoDB metadata persistence integration test

# 1. Create the first JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
test-user1@fragments-testing.com:test-password1
{"service":"DynamoDB"}

# 2. Confirm creation and capture its URL and ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.ownerId" isString
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"
owner_id: jsonpath "$.fragment.ownerId"

# 3. Get the first fragment's metadata
GET {{fragment1_url}}/info
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# Confirm all first-fragment metadata
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.ownerId" == "{{owner_id}}"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 4. Create the second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`DynamoDB is **great**.`

# 5. Confirm creation and capture its URL and ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.ownerId" == "{{owner_id}}"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. Get the second fragment's metadata
GET {{fragment2_url}}/info
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# Confirm all second-fragment metadata
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.ownerId" == "{{owner_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 7. Get all fragment IDs and confirm both are present
GET http://localhost:8080/v1/fragments
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# 8. Delete the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 9. Confirm deletion succeeded
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 10. Try to get the deleted first fragment
GET {{fragment1_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# 11. Confirm the first fragment no longer exists
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# 12. Get all fragment IDs again
GET http://localhost:8080/v1/fragments
[BasicAuth]
test-user1@fragments-testing.com:test-password1

# Confirm the first ID is gone and the second ID remains
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
