#!/usr/bin/env python3
"""Upload artifacts to Cloudflare R2 using boto3"""

import os
import sys
import boto3
from pathlib import Path

def upload_directory_to_r2():
    # Get environment variables
    account_id = os.environ.get('CF_ACCOUNT_ID')
    access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    bucket_name = os.environ.get('R2_BUCKET')
    project_id = os.environ.get('PROJECT_ID')
    
    if not all([account_id, access_key, secret_key, bucket_name, project_id]):
        print("Error: Missing required environment variables")
        sys.exit(1)
    
    # Construct endpoint URL
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    
    # Create S3 client for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name='us-east-1'
    )
    
    # Source and destination paths
    source_dir = Path(f"artifacts/{project_id}")
    dest_prefix = f"builds/{project_id}/dist/"
    
    print(f"Uploading from {source_dir} to s3://{bucket_name}/{dest_prefix}")
    
    # Upload all files
    uploaded_count = 0
    for file_path in source_dir.rglob('*'):
        if file_path.is_file():
            relative_path = file_path.relative_to(source_dir)
            s3_key = f"{dest_prefix}{relative_path}"
            
            print(f"  Uploading {relative_path}...")
            s3_client.upload_file(
                str(file_path),
                bucket_name,
                s3_key
            )
            uploaded_count += 1
    
    print(f"Successfully uploaded {uploaded_count} files")
    
    # Verify upload by listing files
    print("\nVerifying upload:")
    response = s3_client.list_objects_v2(
        Bucket=bucket_name,
        Prefix=dest_prefix,
        MaxKeys=5
    )
    
    if 'Contents' in response:
        for obj in response['Contents']:
            print(f"  ✓ {obj['Key']}")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(upload_directory_to_r2())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)