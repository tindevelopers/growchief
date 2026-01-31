#!/usr/bin/env node
/**
 * Test Bright Data API credentials.
 * Run: node scripts/check-brightdata.mjs (loads .env automatically via dotenv)
 */
import 'dotenv/config';

const API_KEY = process.env.BRIGHTDATA_API_KEY;
const CUSTOMER = process.env.BRIGHTDATA_CUSTOMER;

async function check() {
  console.log('Bright Data credential check');
  console.log('----------------------------');
  console.log('BRIGHTDATA_API_KEY:', API_KEY ? `set (${API_KEY.length} chars)` : 'NOT SET');
  console.log('BRIGHTDATA_CUSTOMER:', CUSTOMER ? `set (${CUSTOMER})` : 'NOT SET');
  console.log('');

  if (!API_KEY) {
    console.log('FAIL: BRIGHTDATA_API_KEY is required');
    process.exit(1);
  }

  try {
    const res = await fetch('https://api.brightdata.com/countrieslist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      console.log(`FAIL: API returned ${res.status}`);
      console.log('Response:', text.slice(0, 300));
      process.exit(1);
    }

    const data = JSON.parse(text);
    const zones = data?.zone_types || data?.zone_type || {};
    const codes =
      zones?.ISP_dedicated_ip?.country_codes ??
      zones?.ISP_dedicated_host?.country_codes ??
      zones?.residential?.country_codes ??
      [];
    const count = Array.isArray(codes) ? codes.length : 0;

    console.log('OK: /countrieslist - Credentials valid');
    console.log(`   Countries available: ${count}`);
    if (count > 0) {
      console.log(`   Sample: ${codes.slice(0, 5).join(', ')}...`);
    }

    if (!CUSTOMER) {
      console.log('');
      console.log('WARN: BRIGHTDATA_CUSTOMER not set - proxy creation will fail');
    } else {
      console.log('');
      console.log('Testing /zone/get_active_zones (used when creating proxy)...');
      const zonesRes = await fetch('https://api.brightdata.com/zone/get_active_zones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      const zonesText = await zonesRes.text();
      if (!zonesRes.ok) {
        console.log(`WARN: get_active_zones returned ${zonesRes.status}`);
        console.log('      ', zonesText.slice(0, 150));
      } else {
        const zonesData = JSON.parse(zonesText);
        const zones = Array.isArray(zonesData) ? zonesData : zonesData?.data || [];
        console.log(`OK: get_active_zones - ${zones.length} active zone(s)`);
      }
    }
  } catch (err) {
    console.log('FAIL:', err.message);
    if (err.cause) console.log('Cause:', err.cause);
    process.exit(1);
  }
}

check();
