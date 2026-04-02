import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách thanh toán | ${s.storeName}`,
    description: `Hướng dẫn chi tiết các hình thức thanh toán tại ${s.storeName}. Cam kết an toàn, bảo mật và hỗ trợ nhiều phương thức thanh toán linh hoạt.`,
  };
}

export default async function PaymentPolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} GUIDELINES</span>
          <h1 className={styles.title}>Chính sách thanh toán</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              Nhằm mang lại cho quý khách hàng những trải nghiệm mua sắm tốt nhất, <strong>{s.storeName}</strong> hỗ trợ các phương thức thanh toán linh hoạt, an toàn và bảo mật. Quý khách có thể lựa chọn một trong các hình thức sau:
            </p>
          </section>

          <section>
            <h2>1. Thanh toán tiền mặt khi nhận hàng (COD)</h2>
            <p>
              Đây là hình thức thanh toán đơn giản và phổ biến nhất. Quý khách sẽ thanh toán bằng tiền mặt cho nhân viên giao hàng sau khi đã kiểm tra và nhận hàng thành công.
            </p>
            <ul>
              <li>Áp dụng cho mọi đơn hàng trên toàn quốc.</li>
              <li>Quý khách vui lòng chuẩn bị đúng số tiền ghi trên hóa đơn.</li>
              <li>Hỗ trợ kiểm tra hàng trước khi thanh toán (theo quy định của đơn vị vận chuyển).</li>
            </ul>
          </section>

          <section>
            <h2>2. Chuyển khoản ngân hàng</h2>
            <p>
              Hình thức này áp dụng cho khách hàng muốn thanh toán trước hoặc các đơn hàng giá trị cao cần xác nhận nhanh chóng.
            </p>
            <div className={styles.bankInfo}>
              <p><strong>Tên chủ TK:</strong> <span>{s.bankAccountName || s.storeName}</span></p>
              <p><strong>Số tài khoản:</strong> <span>{s.bankAccountNumber || '(Chưa cấu hình)'}</span></p>
              <p><strong>Ngân hàng:</strong> <span>{s.bankName || '(Chưa cấu hình)'}</span></p>
              <p><strong>Nội dung:</strong> <span>Mã đơn hàng - Số điện thoại</span></p>
            </div>
            <p style={{ marginTop: '1rem' }}>
              Sau khi chuyển khoản, bộ phận CSKH của <strong>{s.storeName}</strong> sẽ liên hệ xác nhận và tiến hành đóng gói giao hàng cho quý khách.
            </p>
          </section>

          <section>
            <h2>3. Thanh toán trả góp (nếu áp dụng)</h2>
            <p>
              Đối với các sản phẩm có giá trị cao như Laptop, Bàn phím Custom, chúng tôi có hỗ trợ trả góp qua thẻ tín dụng với lãi suất ưu đãi.
            </p>
            <ul>
              <li>Hỗ trợ nhiều ngân hàng liên kết.</li>
              <li>Thời gian trả góp linh hoạt từ 3, 6, 9 đến 12 tháng.</li>
              <li>Thủ tục nhanh gọn, thực hiện hoàn toàn trực tuyến.</li>
            </ul>
          </section>

          <section>
            <h2>4. Bảo mật thông tin thanh toán</h2>
            <p>
              Hệ thống thanh toán của <strong>{s.storeName}</strong> được kết nối với các đối tác thanh toán uy tín và được cấp phép hoạt động hợp pháp tại Việt Nam. Do đó, tiêu chuẩn bảo mật thanh toán đơn hàng tại {s.storeName} đảm bảo tuân thủ các tiêu chuẩn bảo mật ngành.
            </p>
            <p>
              Chúng tôi cam kết không lưu giữ thông tin thẻ nhạy cảm của khách hàng trên hệ thống. Mọi thông tin thẻ đều được xử lý và bảo mật bởi cổng thanh toán theo chuẩn quốc tế PCI DSS.
            </p>
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
