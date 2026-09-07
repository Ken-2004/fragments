# Image conversion and lifecycle integration tests

# 1. Create a PNG fragment
POST http://localhost:8080/v1/fragments
Content-Type: image/png
[BasicAuth]
test-user1@fragments-testing.com:test-password1
file,fixtures/test.png;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"
jsonpath "$.fragment.size" > 0
[Captures]
image_url: header "Location"
image_id: jsonpath "$.fragment.id"

# 2. Retrieve the original PNG
GET {{image_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: image/png
[Asserts]
bytes count > 0
# PNG signature
bytes startsWith hex,89504e470d0a1a0a;

# 3. Convert PNG to JPEG
GET {{image_url}}.jpg
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: image/jpeg
[Asserts]
bytes count > 0
# JPEG signature
bytes startsWith hex,ffd8ff;

# 4. Convert PNG to WebP
GET {{image_url}}.webp
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: image/webp
[Asserts]
bytes count > 0
# WebP uses a RIFF container
bytes startsWith hex,52494646;

# 5. Convert PNG to GIF
GET {{image_url}}.gif
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
Content-Type: image/gif
[Asserts]
bytes count > 0
# GIF87a/GIF89a both begin with GIF8
bytes startsWith hex,47494638;

# 6. Unsupported image conversion returns 415
GET {{image_url}}.bmp
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415

# 7. Confirm image metadata
GET {{image_url}}/info
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{image_id}}"
jsonpath "$.fragment.type" == "image/png"
jsonpath "$.fragment.size" > 0

# 8. Delete the image fragment
DELETE {{image_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# 9. Confirm deleted image no longer exists
GET {{image_url}}
[BasicAuth]
test-user1@fragments-testing.com:test-password1

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
