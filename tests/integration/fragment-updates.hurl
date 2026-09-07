# Fragment update integration tests

# 1. Create a text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Original fragment data`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"
owner_id: jsonpath "$.fragment.ownerId"
created: jsonpath "$.fragment.created"

# 2. Update the fragment
PUT {{fragment_url}}
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Updated fragment data`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
jsonpath "$.fragment.ownerId" == "{{owner_id}}"
jsonpath "$.fragment.created" == "{{created}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 21

# 3. Confirm GET returns the updated data
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Updated fragment data"

# 4. Confirm metadata also contains the updated size
GET {{fragment_url}}/info
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 21

# 5. Attempt to change the fragment Content-Type
PUT {{fragment_url}}
Content-Type: text/markdown
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`# Invalid type change`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400

# 6. Confirm failed type change did not overwrite the data
GET {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Updated fragment data"

# 7. Updating an unknown fragment returns 404
PUT http://localhost:8080/v1/fragments/does-not-exist
Content-Type: text/plain
[BasicAuth]
test-user1@fragments-testing.com:test-password1
`Missing fragment`

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# 8. Delete test fragment
DELETE {{fragment_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
