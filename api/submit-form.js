export const config = { runtime: "edge" };

const NOTION_VER = "2022-06-28";
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = "52651e27-0cf6-4706-b87a-05361ff0f140";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function txt(val) {
  return { rich_text: [{ type: "text", text: { content: (val || "").slice(0, 2000) } }] };
}
function urlProp(val) {
  const v = (val || "").trim();
  return { url: v || null };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { ten, sdt, email, diachi, linhVuc, nganSach, mucTieu, phongCach,
          moTa, dichVu, khachHang, mauSac, slogan,
          coAnh, coLogo, facebook, instagram, webRef, ghiChu } = body;

  if (!NOTION_TOKEN) {
    return new Response(
      JSON.stringify({ success: false, error: "Chưa cấu hình server. Liên hệ 0785 925 998 qua Zalo." }),
      { status: 200, headers: CORS }
    );
  }

  if (!ten || !sdt || !linhVuc || !nganSach) {
    return new Response(
      JSON.stringify({ success: false, error: "Thiếu thông tin bắt buộc" }),
      { status: 400, headers: CORS }
    );
  }

  try {
    const properties = {
      "Tên dự án / Thương hiệu":       { title: [{ type: "text", text: { content: ten } }] },
      "SĐT / Zalo":                    { phone_number: sdt },
      "Địa chỉ":                       txt(diachi),
      "Câu chuyện thương hiệu":        txt(moTa),
      "Danh sách dịch vụ / Sản phẩm": txt(dichVu),
      "Khách hàng mục tiêu":           txt(khachHang),
      "Màu sắc muốn dùng":             txt(mauSac),
      "Slogan":                        txt(slogan),
      "Ghi chú thêm":                  txt(ghiChu),
      "Có ảnh thật sẵn":               { checkbox: coAnh === "co" },
      "Có logo sẵn":                   { checkbox: coLogo === "co" },
      "Facebook":                      urlProp(facebook),
      "Instagram":                     urlProp(instagram),
      "Website tham khảo":             urlProp(webRef),
      "Trạng thái":                    { select: { name: "Tiếp nhận" } },
    };

    if (email)     properties["Email"]               = { email };
    if (linhVuc)   properties["Lĩnh vực"]            = { select: { name: linhVuc } };
    if (nganSach)  properties["Ngân sách"]           = { select: { name: nganSach } };
    if (mucTieu)   properties["Mục tiêu website"]    = { select: { name: mucTieu } };
    if (phongCach) properties["Phong cách thiết kế"] = { select: { name: phongCach } };

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VER,
      },
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.json().catch(() => ({}));
      console.error("Notion error:", JSON.stringify(err));
      return new Response(
        JSON.stringify({ success: false, error: "Lỗi lưu dữ liệu. Vui lòng thử lại." }),
        { status: 200, headers: CORS }
      );
    }

    // Email thông báo nếu có Resend key
    const RESEND = process.env.RESEND_API_KEY;
    if (RESEND) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "TrongLeTour360 <onboarding@resend.dev>",
          to: ["lhtrong0@gmail.com"],
          subject: `🆕 Khách hàng mới: ${ten} — ${linhVuc}`,
          html: `<h2>🆕 Form khảo sát mới</h2>
<p><b>Tên:</b> ${ten}</p>
<p><b>SĐT/Zalo:</b> ${sdt}</p>
<p><b>Lĩnh vực:</b> ${linhVuc}</p>
<p><b>Ngân sách:</b> ${nganSach}</p>
<p><b>Địa chỉ:</b> ${diachi || "—"}</p>
<p><b>Mục tiêu:</b> ${mucTieu || "—"}</p>
<p><b>Mô tả:</b> ${moTa || "—"}</p>
<hr><p>👉 Vào Notion → build web cho khách.</p>`,
        }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true }), { headers: CORS });

  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ success: false, error: "Lỗi server. Vui lòng thử lại sau." }),
      { status: 200, headers: CORS }
    );
  }
}
