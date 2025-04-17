import boto3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_KEY')
AWS_REGION = os.getenv('AWS_REGION')
# Helper to get Instance ID from IP
def get_instance_id_from_ip(ip):
    ec2 = boto3.client(
        'ec2',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=AWS_REGION,
        verify=False  # ⛔️ Development only: disable SSL verification
    )

    response = ec2.describe_instances(Filters=[
        {'Name': 'private-ip-address', 'Values': [ip]}
    ])

    reservations = response.get('Reservations')
    if reservations and reservations[0]['Instances']:
        return reservations[0]['Instances'][0]['InstanceId']
    else:
        return None

@app.route('/cpu-usage')
def cpu_usage():
    ip = request.args.get('ip')
    time_period = int(request.args.get('timePeriod', 60))  # in minutes
    interval = int(request.args.get('interval', 300))      # in seconds

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=time_period)

    instance_id = get_instance_id_from_ip(ip)
    if not instance_id:
        return jsonify({'error': 'Instance ID not found for given IP'}), 404

    cloudwatch = boto3.client(
        'cloudwatch',
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=AWS_REGION,
        verify=False  # ⛔️ Development only: disable SSL verification
    )

    stats = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='CPUUtilization',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start_time,
        EndTime=end_time,
        Period=interval,
        Statistics=['Average']
    )

    datapoints = sorted(stats['Datapoints'], key=lambda x: x['Timestamp'])
    usage_data = [point['Average'] for point in datapoints]
    timestamps = [point['Timestamp'].isoformat() for point in datapoints]

    return jsonify({'usageData': usage_data, 'timestamps': timestamps})

if __name__ == '__main__':
    app.run(debug=True)