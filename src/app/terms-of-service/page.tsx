import styles from '../privacy-policy/page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Điều khoản sử dụng | ${s.storeName}`,
    description: `Điều khoản và điều kiện sử dụng website ${s.storeName}. Quy định về quyền và nghĩa vụ người mua, người bán và các điều kiện giao dịch thương mại điện tử.`,
  };
}

export default async function TermsOfServicePage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} LEGAL</span>
          <h1 className={styles.title}>Điều khoản sử dụng</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              Chào mừng quý khách đến với <strong>{s.storeName}</strong>. Khi truy cập, đăng ký tài khoản hoặc thực hiện bất kỳ giao dịch nào trên website <strong>{s.siteDomain}</strong>, quý khách đồng ý bị ràng buộc bởi các Điều khoản sử dụng dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2>1. Định nghĩa và phạm vi áp dụng</h2>
            <ul>
              <li><strong>"{s.storeName}"</strong> hay <strong>"Chúng tôi"</strong>: Đơn vị sở hữu và vận hành website <strong>{s.siteDomain}</strong>{s.taxCode ? `, Mã số thuế: ${s.taxCode}` : ''}.</li>
              <li><strong>"Khách hàng"</strong> hay <strong>"Bạn"</strong>: Cá nhân hoặc tổ chức truy cập, sử dụng website hoặc thực hiện giao dịch mua bán hàng hóa, dịch vụ.</li>
              <li>Các điều khoản này áp dụng cho mọi hoạt động diễn ra trên website, bao gồm nhưng không giới hạn: tìm kiếm sản phẩm, đặt hàng, thanh toán, sử dụng dịch vụ hỗ trợ.</li>
            </ul>
          </section>

          <section>
            <h2>2. Điều kiện sử dụng website</h2>
            <ul>
              <li>Khách hàng phải từ đủ <strong>18 tuổi</strong> trở lên hoặc có sự giám sát của người giám hộ hợp pháp khi thực hiện giao dịch.</li>
              <li>Thông tin cung cấp khi đặt hàng, đăng ký tài khoản phải <strong>chính xác, đầy đủ và hợp pháp</strong>.</li>
              <li>Nghiêm cấm sử dụng website cho các hoạt động bất hợp pháp, lừa đảo, phá hoại hệ thống hoặc vi phạm quyền sở hữu trí tuệ.</li>
              <li>Mọi nội dung trên website (hình ảnh, văn bản, logo) là tài sản của <strong>{s.storeName}</strong>, không được sao chép, phân phối khi chưa có sự đồng ý bằng văn bản.</li>
            </ul>
          </section>

          <section>
            <h2>3. Quy trình đặt hàng và hợp đồng mua bán</h2>
            <ul>
              <li>Đơn hàng được tạo khi khách hàng hoàn tất các bước đặt hàng và nhận được xác nhận từ hệ thống hoặc nhân viên <strong>{s.storeName}</strong>.</li>
              <li><strong>{s.storeName}</strong> có quyền từ chối hoặc hủy đơn hàng trong các trường hợp: sản phẩm hết hàng, thông tin đặt hàng không hợp lệ, hoặc phát hiện dấu hiệu gian lận.</li>
              <li>Giá sản phẩm hiển thị trên website đã bao gồm thuế VAT (nếu có) nhưng chưa bao gồm phí vận chuyển.</li>
              <li>Hợp đồng mua bán được xem là có hiệu lực khi đơn hàng được xác nhận và thanh toán thành công.</li>
            </ul>
          </section>

          <section>
            <h2>4. Phương thức thanh toán và bảo mật</h2>
            <ul>
              <li>Khách hàng có thể thanh toán qua: Tiền mặt (COD), Chuyển khoản ngân hàng, Ví điện tử (MoMo, ZaloPay, VNPay).</li>
              <li>Mọi thông tin thanh toán được xử lý qua các cổng thanh toán có chứng chỉ bảo mật PCI DSS.</li>
              <li><strong>{s.storeName}</strong> cam kết không lưu trữ thông tin thẻ thanh toán của khách hàng trên hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2>5. Quyền và nghĩa vụ của người bán</h2>
            <p><strong>{s.storeName}</strong> cam kết:</p>
            <ul>
              <li>Cung cấp hàng hóa đúng mô tả, chất lượng và số lượng như đã thỏa thuận.</li>
              <li>Giao hàng đúng thời gian, địa điểm đã cam kết.</li>
              <li>Hỗ trợ giải quyết khiếu nại trong vòng <strong>24 giờ</strong> làm việc kể từ khi nhận được phản ánh.</li>
              <li>Bảo mật thông tin cá nhân của khách hàng theo Chính sách bảo mật đã công bố.</li>
              <li>Tuân thủ các quy định pháp luật Việt Nam về thương mại điện tử.</li>
            </ul>
          </section>

          <section>
            <h2>6. Quyền và nghĩa vụ của người mua</h2>
            <ul>
              <li>Được nhận hàng hóa đúng mô tả, chất lượng đã cam kết.</li>
              <li>Được hỗ trợ đổi trả theo Chính sách đổi trả đã công bố.</li>
              <li>Có trách nhiệm cung cấp thông tin giao hàng chính xác và thanh toán đúng hạn.</li>
              <li>Không được sử dụng thông tin, hình ảnh sản phẩm vào mục đích thương mại khi chưa được phép.</li>
            </ul>
          </section>

          <section>
            <h2>7. Giới hạn trách nhiệm</h2>
            <ul>
              <li><strong>{s.storeName}</strong> không chịu trách nhiệm cho các thiệt hại phát sinh do: sự cố kỹ thuật ngoài tầm kiểm soát, thông tin sai lệch do khách hàng cung cấp, hoặc các trường hợp bất khả kháng (thiên tai, dịch bệnh, quyết định của cơ quan nhà nước...).</li>
              <li>Trách nhiệm tối đa của <strong>{s.storeName}</strong> không vượt quá giá trị đơn hàng thực tế của khách hàng.</li>
            </ul>
          </section>

          <section>
            <h2>8. Giải quyết tranh chấp</h2>
            <ul>
              <li>Mọi tranh chấp phát sinh được ưu tiên giải quyết thông qua <strong>thương lượng, hòa giải</strong>.</li>
              <li>Nếu không đạt được thỏa thuận, tranh chấp sẽ được đưa ra <strong>Tòa án nhân dân</strong> có thẩm quyền tại Việt Nam để giải quyết.</li>
              <li>Khách hàng có thể gửi khiếu nại qua:
                <ul>
                  <li>Hotline: {s.storePhone}</li>
                  <li>Email: {s.storeEmail}</li>
                  <li>Địa chỉ: {s.storeAddress}</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2>9. Thay đổi điều khoản</h2>
            <p>
              <strong>{s.storeName}</strong> có quyền sửa đổi các Điều khoản sử dụng này bất kỳ lúc nào. Phiên bản mới nhất sẽ được đăng tải trên website và có hiệu lực ngay khi đăng tải. Việc tiếp tục sử dụng website sau khi thay đổi được coi là sự chấp thuận với các điều khoản mới.
            </p>
          </section>

          <section>
            <h2>10. Thông tin liên hệ</h2>
            <ul>
              <li><strong>Tên đơn vị:</strong> {s.storeName}</li>
              {s.taxCode && <li><strong>Mã số thuế:</strong> {s.taxCode}</li>}
              <li><strong>Địa chỉ:</strong> {s.storeAddress}</li>
              <li><strong>Hotline:</strong> {s.storePhone}</li>
              <li><strong>Email:</strong> {s.storeEmail}</li>
              <li><strong>Website:</strong> {s.siteDomain}</li>
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
