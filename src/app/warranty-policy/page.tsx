import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';
import WarrantySearch from './WarrantySearch';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách & Tra cứu bảo hành | ${s.storeName}`,
    description: `Quy định về thời hạn, điều kiện và quy trình bảo hành chính hãng tại ${s.storeName}. Tra cứu bảo hành trực tuyến nhanh chóng.`,
  };
}

export default async function WarrantyPolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} SUPPORT</span>
          <h1 className={styles.title}>Chính sách & Tra cứu bảo hành</h1>
        </header>

        {/* Tra cứu bảo hành */}
        <WarrantySearch />

        <article className={styles.content}>
          <section>
            <p>
              <strong>{s.storeName}</strong> cam kết cung cấp các sản phẩm chính hãng với chất lượng tốt nhất. Mọi sản phẩm bán ra đều được áp dụng chính sách bảo hành theo tiêu chuẩn của nhà sản xuất và quy định riêng của {s.storeName}.
            </p>
          </section>

          <section>
            <h2>1. Thời hạn bảo hành</h2>
            <p>Thời gian bảo hành được tính từ ngày quý khách mua hàng hoặc nhận hàng (đối với đơn hàng online):</p>
            <ul>
              <li><strong>Bàn phím cơ & Chuột gaming:</strong> Bảo hành từ 12 - 24 tháng theo từng thương hiệu.</li>
              <li><strong>Tai nghe & Loa:</strong> Bảo hành 12 tháng.</li>
              <li><strong>Lót chuột & Phụ kiện nhỏ:</strong> Bảo hành 1 - 3 tháng (tùy sản phẩm).</li>
              <li><strong>Sản phẩm thanh lý, trưng bày:</strong> Bảo hành theo thỏa thuận cụ thể tại thời điểm mua.</li>
            </ul>
          </section>

          <section>
            <h2>2. Điều kiện bảo hành hợp lệ</h2>
            <p>Để được hưởng chính sách bảo hành, sản phẩm cần đáp ứng các điều kiện sau:</p>
            <ul>
              <li>Sản phẩm còn trong thời hạn bảo hành.</li>
              <li>Còn nguyên tem bảo hành của <strong>{s.storeName}</strong> hoặc của nhà phân phối chính thức tại Việt Nam.</li>
              <li>Sản phẩm không có dấu hiệu bị tháo mở, sửa chữa trái phép.</li>
              <li>Sản phẩm gặp lỗi kỹ thuật phát sinh từ phía nhà sản xuất (không lên nguồn, lỗi cảm biến, lỗi switch, lỗi kết nối...).</li>
            </ul>
          </section>

          <section>
            <h2>3. Các trường hợp từ chối bảo hành</h2>
            <p><strong>{s.storeName}</strong> có quyền từ chối bảo hành đối với các sản phẩm gặp các lỗi sau:</p>
            <ul>
              <li>Sản phẩm bị hư hỏng do tác động vật lý (rơi vỡ, móp méo, va đập).</li>
              <li>Sản phẩm có dấu hiệu bị vào nước, bị ẩm mốc, cháy nổ linh kiện do dùng sai nguồn điện.</li>
              <li>Lỗi do côn trùng hoặc động vật xâm nhập gây hỏng hóc.</li>
              <li>Mất tem bảo hành hoặc tem bị rách, bị tẩy xóa không còn nguyên vẹn.</li>
              <li>Hết thời hạn bảo hành được ghi trên hệ thống hoặc phiếu bảo hành.</li>
            </ul>
          </section>

          <section>
            <h2>4. Hình thức bảo hành</h2>
            <p>Tùy theo tình trạng sản phẩm và quy định của hãng, <strong>{s.storeName}</strong> sẽ áp dụng các hình thức:</p>
            <ul>
              <li><strong>Sửa chữa miễn phí:</strong> Thay thế linh kiện hỏng bằng linh kiện chính hãng mới.</li>
              <li><strong>Đổi sản phẩm mới:</strong> Áp dụng cho các sản phẩm bị lỗi nặng không thể sửa chữa hoặc theo quy định đổi trả trong 7 ngày đầu.</li>
              <li><strong>Đổi sản phẩm tương đương:</strong> Nếu sản phẩm cũ đã ngừng sản xuất, chúng tôi sẽ hỗ trợ đổi sang mẫu tương đương hoặc cao hơn (có bù phí chênh lệch).</li>
            </ul>
          </section>

          <section>
            <h2>5. Quy trình nhận bảo hành</h2>
            <p>Quý khách vui lòng mang sản phẩm đến trực tiếp cửa hàng hoặc gửi qua các đơn vị chuyển phát nhanh kèm theo số điện thoại mua hàng để bộ phận kỹ thuật kiểm tra và xử lý.</p>
            <p>Thời gian xử lý bảo hành trung bình từ 3 - 10 ngày làm việc.</p>
          </section>

          <section>
            <div className={styles.lastUpdate}>
              Cập nhật lần cuối: {lastUpdate}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
