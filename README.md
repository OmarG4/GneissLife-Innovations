# Metatron App

Next.js dashboard for the current Metatron monitoring experience.

## What it includes

- Sidebar app layout
- Device-aware home dashboard
- Interactive troubleshooting section
- Server-side DynamoDB access with a mock-data fallback

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your AWS credentials
3. Run `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

- `AWS_REGION`: DynamoDB region, for example `us-east-1`
- `AWS_ACCESS_KEY_ID`: IAM access key id
- `AWS_SECRET_ACCESS_KEY`: IAM secret key
- `AWS_SESSION_TOKEN`: optional, only needed for temporary credentials
- `DYNAMODB_TABLE_NAME`: defaults to `metatron_device_data`
- `DEVICE_ID`: optional, but recommended for efficient queries if your table uses `device_id` as the partition key

## Current data model

- The home dashboard currently uses simulated telemetry coming from DynamoDB.
- The selected device UI is in place, but `Add New Device` is intentionally disabled.
- Troubleshooting is available in-app as a reference guide based on the device support flow.
