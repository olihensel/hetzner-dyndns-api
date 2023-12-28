//@ts-check
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const HETZNER_DNS_API_TOKEN = process.env.HETZNER_API_KEY;
if (!HETZNER_DNS_API_TOKEN) {
  throw new Error('HETZNER_API_KEY environment variable is required');
}

const HETZNER_API_URL = 'https://dns.hetzner.com/api/v1';

async function handleDnsRequest(ipAddress, zoneId, recordName, apiToken, res) {
  // Verify the API token with environment variable
  const envZoneId = process.env[`API_TOKEN_ZONE_${apiToken}`];
  if (!envZoneId || envZoneId !== zoneId) {
    return res.status(403).send('Invalid API token for the given zone ID');
  }

  try {
    // Fetch all DNS records of the specified zone
    const recordsResponse = await axios.get(
      `${HETZNER_API_URL}/records?zone_id=${zoneId}`,
      {
        headers: { 'Auth-API-Token': HETZNER_DNS_API_TOKEN }
      }
    );

    const records = recordsResponse.data.records;
    console.log(records)
    const existingRecord = records.find(record => record.name === recordName);

    const recordData = {
      value: ipAddress,
      type: 'A', // Assuming an 'A' record, change as needed
      ttl: 30, // TTL set to 30 seconds
      name: recordName,
      zone_id: zoneId,
    };

    // Handle record existence and IP address comparison  
    if (existingRecord) {
      if (existingRecord.value === ipAddress) {
        return res.status(200).send(`Not Modified - ${ipAddress} already set for ${recordName}`);
      }
      await axios.put(
        `${HETZNER_API_URL}/records/${existingRecord.id}`,
        recordData,
        {
          headers: {
            'Auth-API-Token': HETZNER_DNS_API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.send(`DNS record updated with new IP address ${ipAddress} for ${recordName}`);
    } else {
      await axios.post(
        `${HETZNER_API_URL}/records`,
        recordData,
        {
          headers: {
            'Auth-API-Token': HETZNER_DNS_API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.send(`New DNS record created with IP address ${ipAddress} for ${recordName}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error handling DNS record:', error.response?.data, error.response?.status);
      console.log('Request config:', error.config);
    }
    else { console.error('Error handling DNS record:', error); }
    res.status(500).send('Failed to handle DNS record');
  }
}

app.post('/update-dns', (req, res) => {
  const { ipAddress, zoneId, recordName, apiToken } = req.body;
  if (!ipAddress || !zoneId || !recordName || !apiToken) {
    return res.status(400).send('IP address, zone ID, record name, and API token are required');
  }
  handleDnsRequest(ipAddress, zoneId, recordName, apiToken, res);
});

app.get('/update-dns', (req, res) => {
  const { ipAddress, zoneId, recordName, apiToken } = req.query;
  if (!ipAddress || !zoneId || !recordName || !apiToken) {
    return res.status(400).send('IP address, zone ID, record name, and API token are required');
  }
  handleDnsRequest(ipAddress, zoneId, recordName, apiToken, res);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
