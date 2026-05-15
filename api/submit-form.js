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

  const properties = {
    'Tên dự án / Thương hiệu': { title: [{ text: { content: String(b.ten).slice(0, 200) } }] },
    'SĐT / Zalo':              { phone_number: b.sdt || null },
    'Địa chỉ':                 { rich_text: rt(b.diachi) },
    'Câu chuyện thương hiệu':  { rich_text: rt(b.moTa) },
    'Danh sách dịch vụ / Sản phẩm': { rich_text: rt(b.dichVu) },
    'Khách hàng mục tiêu':     { rich_text: rt(b.khachHang) },
    'Màu sắc muốn dùng':       { rich_text: rt(b.mauSac) },
    'Slogan':                  { rich_text: rt(b.slogan) },
    'Ghi chú thêm':            { rich_text: rt(b.ghiChu) },
    'Có ảnh thật sẵn':         { checkbox: b.coAnh === 'co' },
    'Có logo sẵn':             { checkbox: b.coLogo === 'co' },
    'Trạng thái':              { select: { name: 'Tiếp nhận' } },
  };

  if (b.email)      properties['Email']                  = { email: b.email };
  if (b.linhVuc)    properties['Lĩnh vực']               = { select: { name: b.linhVuc } };
  if (b.nganSach)   properties['Ngân sách']              = { select: { name: b.nganSach } };
  if (b.phongCach)  properties['Phong cách thiết kế']    = { select: { name: b.phongCach } };
  if (b.mucTieu)    properties['Mục tiêu website']       = { select: { name: b.mucTieu } };
  if (b.facebook)   properties['Facebook']               = { url: b.facebook };
  if (b.instagram)  properties['Instagram']              = { url: b.instagram };
  if (b.webRef)     properties['Website tham khảo']      = { url: b.webRef };

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
      return res.status(500).json({ error: 'Không lưu được. Vui lòng thử lại.' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};
