import styles from '../privacy-policy/page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách kiểm hàng | ${s.storeName}`,
    description: `Quy định kiểm tra hàng hóa khi nhận hàng tại ${s.storeName}. Quyền lợi người mua, trách nhiệm các bên trong quá trình giao nhận và kiểm định sản phẩm.`,
  };
}

export default async function KiemHangPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} SUPPORT</span>
          <h1 className={styles.title}>Chính sách kiểm hàng</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              <strong>{s.storeName}</strong> cam kết tạo điều kiện tối đa để khách hàng có thể kiểm tra hàng hóa trước khi chấp nhận giao dịch. Chính sách kiểm hàng được xây dựng nhằm bảo vệ quyền lợi người tiêu dùng và đảm bảo tính minh bạch trong toàn bộ quá trình mua bán.
            </p>
          </section>

          <section>
            <h2>1. Quyền kiểm hàng của khách hàng</h2>
            <p>Khách hàng có quyền yêu cầu kiểm tra hàng hóa trong các trường hợp sau:</p>
            <ul>
              <li>Khi nhận hàng từ đơn vị vận chuyển tại địa chỉ giao hàng đã đặt.</li>
              <li>Khi nhận hàng trực tiếp tại cửa hàng <strong>{s.storeName}</strong>.</li>
              <li>Trong thời hạn đổi trả theo <strong>Chính sách đổi trả</strong> đã công bố (7 ngày).</li>
            </ul>
          </section>

          <section>
            <h2>2. Nội dung kiểm hàng khi nhận từ shipper</h2>
            <p>Khi nhận hàng qua đơn vị vận chuyển (COD hoặc giao sau thanh toán), khách hàng có quyền kiểm tra:</p>
            <ul>
              <li><strong>Ngoại quan bao bì:</strong> Kiểm tra hộp/thùng carton có bị méo, rách, ướt, hoặc có dấu hiệu đã mở trước hay không.</li>
              <li><strong>Số lượng sản phẩm:</strong> Đối chiếu số lượng thực tế với số lượng trên phiếu giao hàng/hóa đơn.</li>
              <li><strong>Đúng mẫu mã, màu sắc:</strong> Đối chiếu sản phẩm nhận được với thông tin đã đặt hàng (tên SP, màu, phiên bản).</li>
              <li><strong>Tình trạng niêm phong:</strong> Kiểm tra tem niêm phong của nhà sản xuất còn nguyên vẹn không.</li>
            </ul>
            <p>
              <em>Lưu ý quan trọng:</em> Việc kiểm hàng với shipper chỉ bao gồm kiểm tra <strong>ngoại quan</strong>. <strong>{s.storeName}</strong> không hỗ trợ cắm điện kiểm tra chức năng tại chỗ khi đồng kiểm với shipper.
            </p>
          </section>

          <section>
            <h2>3. Quy trình xử lý khi phát hiện vấn đề khi đồng kiểm</h2>
            <ul>
              <li>
                <strong>Hàng sai / thiếu / hỏng ngoại quan:</strong> Khách hàng có quyền <strong>từ chối nhận hàng</strong> và yêu cầu shipper ghi nhận vào biên bản giao nhận. Liên hệ ngay <strong>{s.storeName}</strong> qua hotline <strong>{s.storePhone}</strong> để được xử lý trong vòng 24 giờ.
              </li>
              <li>
                <strong>Chứng từ không hợp lệ:</strong> Nếu phiếu giao hàng không khớp thông tin đơn đặt hàng, khách hàng có quyền yêu cầu xác nhận lại trước khi ký nhận.
              </li>
              <li>
                <strong>Hàng bình thường:</strong> Ký nhận, thanh toán (nếu COD) và sử dụng theo hướng dẫn.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Quy trình kiểm hàng tại cửa hàng</h2>
            <p>Khi mua hàng trực tiếp hoặc đến cửa hàng nhận hàng, nhân viên <strong>{s.storeName}</strong> sẽ hỗ trợ:</p>
            <ul>
              <li>Mở hộp và kiểm tra đầy đủ sản phẩm, phụ kiện đi kèm cùng khách hàng.</li>
              <li>Cắm điện kiểm tra chức năng cơ bản (bật, kết nối, đèn LED, âm thanh...) nếu khách yêu cầu.</li>
              <li>Cung cấp hóa đơn/phiếu bảo hành ngay sau khi khách xác nhận nhận hàng.</li>
              <li>Hỗ trợ đổi hàng ngay tại chỗ nếu phát hiện lỗi kỹ thuật trong quá trình kiểm.</li>
            </ul>
          </section>

          <section>
            <h2>5. Trách nhiệm các bên trong quá trình kiểm hàng</h2>
            <ul>
              <li>
                <strong>{s.storeName}:</strong> Đóng gói hàng hóa cẩn thận, dán niêm phong, cung cấp đầy đủ phụ kiện và chứng từ hàng hóa (phiếu giao hàng, hóa đơn). Chịu trách nhiệm nếu hàng bị thiếu, sai, hỏng do lỗi đóng gói.
              </li>
              <li>
                <strong>Đơn vị vận chuyển:</strong> Bảo quản hàng nguyên vẹn trong suốt quá trình vận chuyển. Hỗ trợ khách hàng kiểm tra ngoại quan khi giao hàng. Chịu trách nhiệm nếu hàng bị hư hỏng do quá trình vận chuyển.
              </li>
              <li>
                <strong>Khách hàng:</strong> Kiểm tra kỹ hàng hóa trước khi ký nhận. Sau khi ký nhận, nếu phát hiện lỗi, áp dụng theo <strong>Chính sách bảo hành</strong> và <strong>Chính sách đổi trả</strong> đã công bố.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Liên hệ hỗ trợ kiểm hàng</h2>
            <ul>
              <li><strong>Hotline:</strong> {s.storePhone} (hỗ trợ trong giờ làm việc)</li>
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
