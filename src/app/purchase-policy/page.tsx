import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách mua hàng | ${s.storeName}`,
    description: `Hướng dẫn các bước mua hàng, đặt hàng và quy trình xác nhận đơn hàng tại ${s.storeName}. Mua sắm dễ dàng, an toàn và nhanh chóng.`,
  };
}

export default async function PurchasePolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} SHOPPING</span>
          <h1 className={styles.title}>Chính sách mua hàng</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              Chào mừng quý khách đến với <strong>{s.storeName}</strong>. Để quá trình mua sắm của quý khách diễn ra thuận lợi và nhanh chóng, chúng tôi xin hướng dẫn các bước mua hàng và các quy định liên quan như sau:
            </p>
          </section>

          <section>
            <h2>1. Các bước đặt hàng trực tuyến</h2>
            <p>Quý khách có thể dễ dàng đặt hàng tại website <strong>{s.siteDomain}</strong> qua các bước sau:</p>
            <ul>
              <li><strong>Bước 1:</strong> Tìm kiếm và lựa chọn sản phẩm yêu thích. Xem kỹ thông số kỹ thuật, giá cả và các chương trình khuyến mãi đi kèm.</li>
              <li><strong>Bước 2:</strong> Thêm sản phẩm vào giỏ hàng. Quý khách có thể tiếp tục mua sắm hoặc tiến hành thanh toán ngay.</li>
              <li><strong>Bước 3:</strong> Nhập thông tin giao hàng gồm Họ tên, Số điện thoại và Địa chỉ chính xác để chúng tôi phục vụ tốt nhất.</li>
              <li><strong>Bước 4:</strong> Chọn phương thức thanh toán phù hợp (COD, Chuyển khoản, Ví điện tử).</li>
              <li><strong>Bước 5:</strong> Xác nhận đơn hàng. Hệ thống sẽ gửi thông báo đặt hàng thành công qua Email hoặc tin nhắn.</li>
            </ul>
          </section>

          <section>
            <h2>2. Xác nhận đơn hàng</h2>
            <p>
              Sau khi nhận được đơn hàng, đội ngũ nhân viên của <strong>{s.storeName}</strong> sẽ liên hệ với quý khách trong vòng 30 - 60 phút (trong giờ làm việc) để xác nhận lại thông tin đơn hàng, phí vận chuyển và thời gian giao hàng dự kiến.
            </p>
            <p>Đơn hàng chỉ được xem là hợp lệ khi có sự xác nhận trực tiếp từ nhân viên hoặc thông báo "Đã xác nhận" trên hệ thống.</p>
          </section>

          <section>
            <h2>3. Thay đổi hoặc Hủy đơn hàng</h2>
            <ul>
              <li><strong>Thay đổi:</strong> Nếu quý khách muốn thay đổi sản phẩm, địa chỉ hoặc số điện thoại, vui lòng gọi ngay hotline <strong>{s.storePhone}</strong> trước khi đơn hàng được bàn giao cho đơn vị vận chuyển.</li>
              <li><strong>Hủy đơn:</strong> Quý khách có thể hủy đơn hàng bất kỳ lúc nào trước khi hàng được gửi đi mà không mất phí.</li>
            </ul>
          </section>

          <section>
            <h2>4. Kiểm tra và Nhận hàng</h2>
            <p>
              Khi nhận hàng, quý khách vui lòng kiểm tra kỹ tình trạng bao bì và số lượng sản phẩm. Nếu có bất kỳ dấu hiệu hư hỏng hoặc sai sót, quý khách có quyền từ chối nhận hàng và báo ngay cho chúng tôi qua hotline <strong>{s.storePhone}</strong>.
            </p>
          </section>

          <section>
            <h2>5. Thông tin liên hệ hỗ trợ</h2>
            <p>Mọi thắc mắc trong quá trình mua hàng, quý khách vui lòng liên hệ:</p>
            <ul>
              <li><strong>Hotline:</strong> {s.storePhone}</li>
              <li><strong>Email:</strong> {s.storeEmail}</li>
              <li><strong>Địa chỉ:</strong> {s.storeAddress}</li>
            </ul>
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
