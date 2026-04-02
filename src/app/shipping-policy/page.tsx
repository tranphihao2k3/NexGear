import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách vận chuyển | ${s.storeName}`,
    description: `Chi tiết về thời gian, phí vận chuyển và quy trình giao nhận hàng tại ${s.storeName}. Miễn phí vận chuyển toàn quốc cho đơn hàng từ 2.000.000 VNĐ.`,
  };
}

export default async function ShippingPolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} LOGISTICS</span>
          <h1 className={styles.title}>Chính sách vận chuyển</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              <strong>{s.storeName}</strong> luôn nỗ lực để cung cấp dịch vụ giao hàng tốt nhất cho khách hàng. Chúng tôi cam kết mang sản phẩm đến tay bạn một cách nhanh chóng, an toàn và chuyên nghiệp nhất.
            </p>
          </section>

          <section>
            <h2>1. Phạm vi áp dụng</h2>
            <p>
              Chúng tôi thực hiện giao hàng trên phạm vi toàn quốc (63 tỉnh thành). <strong>{s.storeName}</strong> hợp tác với các đơn vị vận chuyển uy tín như Giao Hàng Tiết Kiệm, Giao Hàng Nhanh, Viettel Post để đảm bảo đơn hàng của quý khách luôn an toàn.
            </p>
          </section>

          <section>
            <h2>2. Thời gian giao hàng</h2>
            <p>Thời gian nhận hàng dự kiến tùy thuộc vào khu vực địa lý của quý khách:</p>
            <ul>
              <li><strong>Khu vực Nội thành (Hà Nội, TP.HCM):</strong> Giao trong vòng 1 - 2 ngày làm việc.</li>
              <li><strong>Khu vực Ngoại thành & Tỉnh:</strong> Giao từ 3 - 5 ngày làm việc tùy vào địa chỉ cụ thể.</li>
              <li><strong>Giao hàng hỏa tốc:</strong> Hỗ trợ giao trong 2 giờ tại khu vực TP.HCM (áp dụng cho một số sản phẩm và khung giờ nhất định).</li>
            </ul>
          </section>

          <section>
            <h2>3. Phí vận chuyển</h2>
            <p><strong>{s.storeName}</strong> áp dụng chính sách phí vận chuyển linh hoạt:</p>
            <ul>
              <li><strong>Miễn phí vận chuyển:</strong> Áp dụng cho đơn hàng có tổng giá trị từ 2.000.000 VNĐ trở lên trên toàn quốc.</li>
              <li><strong>Phí cố định:</strong> Đối với đơn hàng dưới 2.000.000 VNĐ, phí giao hàng dao động từ 25.000 VNĐ - 50.000 VNĐ tùy theo trọng lượng và kích thước sản phẩm.</li>
              <li>Phí vận chuyển chính xác sẽ được thông báo cụ thể tại trang Thanh toán khi bạn nhập địa chỉ giao hàng.</li>
            </ul>
          </section>

          <section>
            <h2>4. Quy định đồng kiểm</h2>
            <p>
              Để đảm bảo quyền lợi tối đa cho khách hàng, <strong>{s.storeName}</strong> áp dụng chính sách <strong>Đồng kiểm</strong> khi nhận hàng. Quý khách có quyền mở hộp kiểm tra ngoại quan sản phẩm trước khi thanh toán cho nhân viên giao hàng.
            </p>
            <p>
              <em>Lưu ý:</em> Chỉ kiểm tra ngoại quan (số lượng, đúng mẫu mã, không móp méo, bể vỡ). Không hỗ trợ cắm điện dùng thử tại chỗ khi đồng kiểm.
            </p>
          </section>

          <section>
            <h2>5. Trách nhiệm với hàng hóa</h2>
            <p>
              Trong trường hợp xảy ra sự cố do lỗi của đơn vị vận chuyển (thất lạc, hư hỏng...), <strong>{s.storeName}</strong> cam kết sẽ giải quyết thỏa đáng, gửi lại sản phẩm mới hoặc hoàn tiền ngay cho quý khách qua hotline <strong>{s.storePhone}</strong>.
            </p>
          </section>

          <section>
            <h2>6. Phân định trách nhiệm cung cấp chứng từ hàng hóa</h2>
            <p>
              Nhằm đảm bảo quyền lợi người tiêu dùng và tuân thủ quy định pháp luật về thương mại điện tử, <strong>{s.storeName}</strong> phân định rõ trách nhiệm cung cấp chứng từ hàng hóa trong quá trình giao nhận như sau:
            </p>
            <ul>
              <li>
                <strong>{s.storeName} (Thương nhân bán hàng)</strong> chịu trách nhiệm lập và cung cấp đầy đủ các chứng từ liên quan đến hàng hóa, bao gồm: phiếu xuất kho, hóa đơn bán hàng (hoặc phiếu giao hàng), phiếu đóng gói (packing list). Các chứng từ này được giao cho đơn vị vận chuyển khi bàn giao hàng hóa.
              </li>
              <li>
                <strong>Đơn vị vận chuyển (GHTK, GHN, Viettel Post...)</strong> chịu trách nhiệm bảo quản và đảm bảo tính nguyên vẹn của hàng hóa và chứng từ kèm theo trong suốt quá trình vận chuyển từ kho <strong>{s.storeName}</strong> đến tay người nhận.
              </li>
              <li>
                <strong>Khách hàng (Người nhận)</strong> có quyền yêu cầu kiểm tra chứng từ hàng hóa (hóa đơn, phiếu giao hàng) trước khi ký nhận. Trường hợp chứng từ không khớp hoặc hàng hóa có dấu hiệu bất thường, khách hàng có quyền từ chối nhận và liên hệ ngay hotline <strong>{s.storePhone}</strong> để được hỗ trợ.
              </li>
            </ul>
            <p>
              <em>Lưu ý:</em> Mọi tranh chấp phát sinh liên quan đến chứng từ hàng hóa trong quá trình giao nhận sẽ được <strong>{s.storeName}</strong> phối hợp với đơn vị vận chuyển giải quyết trong vòng <strong>3 ngày làm việc</strong> kể từ khi nhận được phản ánh từ khách hàng.
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
