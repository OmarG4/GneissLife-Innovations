# Metatron Dashboard

Simple Next.js dashboard for the `metatron_device_data` DynamoDB table.

## What it includes

- KPI cards for battery, temperature, humidity, IAQ, VOC index, and mold risk
- A temperature area chart
- A multi-line air-quality chart
- A recent readings table
- Server-side DynamoDB access with a mock-data fallback

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your AWS credentials and region
3. Run `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

- `AWS_REGION`: DynamoDB region, for example `us-east-1`
- `AWS_ACCESS_KEY_ID`: IAM access key id
- `AWS_SECRET_ACCESS_KEY`: IAM secret key
- `AWS_SESSION_TOKEN`: optional, only needed for temporary credentials
- `DYNAMODB_TABLE_NAME`: defaults to `metatron_device_data`
- `DEVICE_ID`: optional, but recommended for efficient queries if your table uses `device_id` as the partition key

## DynamoDB notes

The app will:

- use a `Query` when `DEVICE_ID` is set
- otherwise use a small `Scan`
- fall back to mock data if credentials are missing or DynamoDB access fails

If your table key schema is different, update `lib/readings.ts` with the correct query expression.
