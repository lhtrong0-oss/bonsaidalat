module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body;
  if (!b || !b.ten || !b.sdt) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  }

  const rt = (val) => val
    ? [{ type: 'text', text: { content: String(val).slice(0, 2000) } }]
    : [];

  // Keys are Notion property IDs (avoid Vietnamese name encoding issues)
  const properties = {
    'title':      { title: [{ text: { content: String(b.ten).slice(0, 200) } }] },
    '%3Em%7DS':   { phone_number: b.sdt || null },
    'VP%7BN':     { rich_text: rt(b.diachi) },
    '%5DXlu':     { rich_text: rt(b.moTa) },
    '%7DJbR':     { rich_text: rt(b.dichVu) },
    'TZdx':       { rich_text: rt(b.khachHang) },
    'E%5Czg':     { rich_text: rt(b.mauSac) },
    '%3EU%3Bf':   { rich_text: rt(b.slogan) },
    'uviv':       { rich_text: rt(b.ghiChu) },
    'y_eh':       { checkbox: b.coAnh === 'co' },
    '%7DRZj':     { checkbox: b.coLogo === 'co' },
    'r%3BXs':     { select: { id: '4aa0c007-08f8-4a1d-8572-38f16f02c061' } },
  };

  if (b.email)     properties['_ade']        = { email: b.email };
  if (b.linhVuc)   properties['JLVw']        = { select: { name: b.linhVuc } };
  if (b.nganSach)  properties['%40%5E%7Bo'] = { select: { name: b.nganSach } };
  if (b.phongCach) properties['%5D~pj']     = { select: { name: b.phongCach } };
  if (b.mucTieu)   properties['Oo%60%40']   = { select: { name: b.mucTieu } };
  if (b.facebook)  properties['Ex%5CR']     = { url: b.facebook };
  if (b.instagram) properties['~VZv']       = { url: b.instagram };
  if (b.webRef)    properties['_TfR']       = { url: b.webRef };

  try {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: '52651e27-0cf6-4706-b87a-05361ff0f140' },
        properties,
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      console.error('Notion error:', JSON.stringify(err));
      return res.status(500).json({ error: 'Không lưu được.', detail: err });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};
