<feature>
  <meta>
    <id>file_s3_compatible_api</id>
    <title>S3-compatible API</title>
    <group>Storage</group>
    <status>done</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    App expose S3-compatible HTTP API trên một port riêng (hoặc path prefix).
    Client bên ngoài kết nối bằng AWS SDK, MinIO SDK, mc CLI, rclone,
    hoặc bất kỳ tool S3-compatible nào. Implement đủ các operations cơ bản
    để client hoạt động bình thường.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Developer</actor>
      <action>kết nối app bằng aws-sdk với endpoint localhost:PORT</action>
      <benefit>sử dụng S3 SDK quen thuộc mà không cần chạy MinIO riêng</benefit>
    </story>
    <story id="US-02">
      <actor>Developer</actor>
      <action>dùng mc CLI (MinIO Client) để quản lý files</action>
      <benefit>quản lý storage từ terminal</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">S3 API server chạy trên port riêng (cấu hình qua env S3_PORT, mặc định: 9000) hoặc path prefix /s3.</criterion>
    <criterion id="AC-02">Implement AWS Signature V4 authentication (Authorization header).</criterion>
    <criterion id="AC-03">Bucket operations: ListBuckets (GET /), CreateBucket (PUT /{bucket}), DeleteBucket (DELETE /{bucket}), HeadBucket (HEAD /{bucket}).</criterion>
    <criterion id="AC-04">Object operations: PutObject (PUT /{bucket}/{key}), GetObject (GET /{bucket}/{key}), DeleteObject (DELETE /{bucket}/{key}), HeadObject (HEAD /{bucket}/{key}).</criterion>
    <criterion id="AC-05">List operations: ListObjectsV2 (GET /{bucket}?list-type=2) — hỗ trợ prefix, delimiter, max-keys, continuation-token.</criterion>
    <criterion id="AC-06">Bulk operations: DeleteObjects (POST /{bucket}?delete).</criterion>
    <criterion id="AC-07">Response format XML theo chuẩn S3 (ListBucketResult, ListAllMyBucketsResult...).</criterion>
    <criterion id="AC-08">Headers chuẩn S3: ETag, Content-Type, Content-Length, Last-Modified, x-amz-request-id.</criterion>
    <criterion id="AC-09">Error responses XML: NoSuchBucket, NoSuchKey, BucketAlreadyExists, AccessDenied...</criterion>
    <criterion id="AC-10">Compatible với: aws-sdk-js, @aws-sdk/client-s3, minio-js, mc CLI, rclone.</criterion>
  </acceptance-criteria>
</feature>
