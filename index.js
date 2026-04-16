//@ts-check
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());


const HETZNER_CLOUD_API_TOKEN = process.env.HETZNER_API_KEY;
if (!HETZNER_CLOUD_API_TOKEN) {
  throw new Error('HETZNER_API_KEY environment variable is required');
}

const HETZNER_API_URL = 'https://api.hetzner.cloud/v1';


async function handleDnsRequest(ipAddress, zoneId, recordName, apiToken, res) {
  // Verify the API token with environment variable
  const envZoneId = process.env[`API_TOKEN_ZONE_${apiToken}`];
  if (!envZoneId || envZoneId !== zoneId) {
    return res.status(403).send('Invalid API token for the given zone ID');
  }

  // Namenskonventionen: lowercase, Apex = @
  let rrsetName = recordName.trim().toLowerCase();
  if (rrsetName === '' || rrsetName === '@') {
    rrsetName = '@';
  }

  // TTL mindestens 60
  let ttl = 60;
  if (process.env.DEFAULT_TTL && Number(process.env.DEFAULT_TTL) >= 60) {
    ttl = Number(process.env.DEFAULT_TTL);
  }

  try {
    // Hole bestehendes RRSet
    let rrsetResp = null;
    let rrsetExists = false;
    try {
      rrsetResp = await axios.get(
        `${HETZNER_API_URL}/zones/${zoneId}/rrsets/${encodeURIComponent(rrsetName)}/A`,
        {
          headers: { 'Authorization': `Bearer ${HETZNER_CLOUD_API_TOKEN}` }
        }
      );
      rrsetExists = true;
    } catch (e) {
      if (!(e.response && e.response.status === 404)) throw e;
    }

    if (!rrsetExists) {
      // RRSet existiert nicht, lege es an
      await axios.post(
        `${HETZNER_API_URL}/zones/${zoneId}/rrsets`,
        {
          name: rrsetName,
          type: 'A',
          ttl: ttl,
          records: [
            {
              value: ipAddress
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${HETZNER_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.send(`New DNS RRSet created with IP address ${ipAddress} for ${rrsetName}`);
    }

    let currentRecords = [];
    if (rrsetResp && rrsetResp.data && rrsetResp.data.rrset) {
      currentRecords = rrsetResp.data.rrset.records;
      // Prüfe, ob IP bereits gesetzt ist
      if (currentRecords.length === 1 && currentRecords[0].value === ipAddress) {
        return res.status(200).send(`Not Modified - ${ipAddress} already set for ${rrsetName}`);
      }
    }

    // set_records überschreibt alle Records im RRSet
    const setRecordsPayload = {
      records: [
        {
          value: ipAddress,
          ttl: ttl
        }
      ]
    };

    await axios.post(
      `${HETZNER_API_URL}/zones/${zoneId}/rrsets/${encodeURIComponent(rrsetName)}/A/actions/set_records`,
      setRecordsPayload,
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.send(`DNS RRSet updated with new IP address ${ipAddress} for ${rrsetName}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error handling DNS RRSet:', JSON.stringify(error.response?.data, null, 2), error.response?.status);
      console.log('Request config:', error.config);
    }
    else { console.error('Error handling DNS RRSet:', error); }
    res.status(500).send('Failed to handle DNS RRSet');
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
