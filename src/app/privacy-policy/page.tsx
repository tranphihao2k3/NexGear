import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách bảo mật thông tin | ${s.storeName}`,
    description: `Chính sách bảo mật thông tin khách hàng tại ${s.storeName}. Cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của khách hàng.`,
  };
}

export default async function PrivacyPolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} LEGAL</span>
          <h1 className={styles.title}>Chính sách bảo mật</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              Cảm ơn quý khách đã truy cập vào website <strong>{s.storeName}</strong>. Chúng tôi tôn trọng và cam kết bảo mật những thông tin mang tính riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi tiếp nhận, sử dụng và (trong những trường hợp nhất định) tiết lộ thông tin cá nhân của bạn.
            </p>
            <p>
              Bảo vệ dữ liệu cá nhân và gây dựng được niềm tin cho quý khách là vấn đề rất quan trọng với chúng tôi. Vì vậy, chúng tôi sẽ dùng tên và các thông tin khác liên quan đến quý khách tuân thủ theo nội dung của chính sách bảo mật.
            </p>
          </section>

          <section>
            <h2>1. Thu thập thông tin cá nhân</h2>
            <p>
              Chúng tôi thu thập, lưu trữ và xử lý thông tin của bạn cho quá trình mua hàng và cho những thông báo sau này liên quan đến đơn hàng, và để cung cấp dịch vụ, bao gồm một số thông tin cá nhân:
            </p>
            <ul>
              <li>Họ và tên, giới tính, ngày sinh.</li>
              <li>Địa chỉ email, địa chỉ giao hàng, số điện thoại.</li>
              <li>Chi tiết thanh toán (thẻ ngân hàng, chi tiết ví điện tử).</li>
              <li>Địa chỉ IP, lịch sử truy cập và hành vi trên website.</li>
            </ul>
          </section>

          <section>
            <h2>2. Sử dụng thông tin cá nhân</h2>
            <p>
              Thông tin cá nhân thu thập được sẽ chỉ được sử dụng trong nội bộ <strong>{s.storeName}</strong> và cho một hoặc tất cả các mục đích sau đây:
            </p>
            <ul>
              <li>Hỗ trợ khách hàng trong quá trình mua sắm.</li>
              <li>Xử lý các đơn đặt hàng và cung cấp dịch vụ/thông tin qua trang web của chúng tôi theo yêu cầu của bạn.</li>
              <li>Giao hàng bạn đã mua tại website.</li>
              <li>Thông báo về việc giao hàng và hỗ trợ khách hàng.</li>
              <li>Cung cấp thông tin liên quan đến sản phẩm, các chương trình khuyến mãi nếu bạn đăng ký nhận tin.</li>
              <li>Quản lý tài khoản (nếu có); xác nhận và thực hiện các giao dịch tài chính liên quan đến các khoản thanh toán trực tuyến của bạn.</li>
            </ul>
          </section>

          <section>
            <h2>3. Bảo mật thông tin</h2>
            <p>
              Chúng tôi cam kết đảm bảo an toàn cho thông tin của quý khách khi đăng ký với chúng tôi. Chúng tôi đã thiết lập các quy trình vật lý, điện tử và quản lý thích hợp để bảo vệ và bảo mật các thông tin mà chúng tôi thu thập trực tuyến.
            </p>
            <ul>
              <li>Dữ liệu được mã hóa bằng giao thức SSL khi truyền tải qua Internet.</li>
              <li>Chỉ nhân viên có thẩm quyền mới được tiếp cận thông tin cá nhân.</li>
              <li>Các hệ thống máy chủ được đặt trong môi trường an toàn, có tường lửa kiểm soát chặt chẽ.</li>
            </ul>
          </section>

          <section>
            <h2>4. Quyền lợi khách hàng</h2>
            <p>
              Quý khách có quyền yêu cầu truy cập vào dữ liệu cá nhân của mình, có quyền yêu cầu chúng tôi sửa lại những sai sót trong dữ liệu của bạn mà không mất phí. Bất cứ lúc nào bạn cũng có quyền yêu cầu chúng tôi ngưng sử dụng dữ liệu cá nhân của bạn cho mục đích tiếp thị.
            </p>
          </section>

          <section>
            <h2>5. Chia sẻ thông tin với bên thứ ba</h2>
            <p>
              Chúng tôi có thể chuyển thông tin của quý khách cho các đối tác của chúng tôi trong khuôn khổ quy định của chính sách bảo mật này. Ví dụ: chúng tôi có thể chuyển thông tin của quý khách cho các bên vận chuyển, các đơn vị thanh toán hoặc bên thứ ba để xử lý dữ liệu và cung cấp dịch vụ cho chúng tôi.
            </p>
          </section>

          <section>
            <h2>6. Những người và tổ chức có thể tiếp cận thông tin cá nhân</h2>
            <p>
              Thông tin cá nhân của quý khách chỉ được tiếp cận bởi các đối tượng sau đây trong phạm vi cần thiết để thực hiện dịch vụ:
            </p>
            <ul>
              <li><strong>Nhân viên nội bộ {s.storeName}</strong> — chỉ những bộ phận có liên quan trực tiếp (bán hàng, kho vận, kế toán, CSKH) mới được truy cập thông tin đặt hàng và thông tin cá nhân của khách hàng.</li>
              <li><strong>Đơn vị vận chuyển</strong> (GHTK, GHN, Viettel Post...) — nhận thông tin họ tên, SĐT, địa chỉ giao hàng để thực hiện giao nhận.</li>
              <li><strong>Cổng thanh toán</strong> (VNPay, MoMo, ZaloPay...) — nhận thông tin giao dịch cần thiết để xử lý thanh toán theo chuẩn bảo mật PCI DSS.</li>
              <li><strong>Cơ quan nhà nước có thẩm quyền</strong> — trong trường hợp pháp luật yêu cầu cung cấp thông tin theo quyết định hoặc yêu cầu chính thức.</li>
            </ul>
            <p>
              <strong>{s.storeName}</strong> cam kết không bán, không cho thuê hoặc tiết lộ thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào khác ngoài các đối tượng nêu trên mà không có sự đồng ý của khách hàng.
            </p>
          </section>

          <section>
            <h2>7. Cơ chế tiếp nhận và giải quyết khiếu nại</h2>
            <p>
              <strong>{s.storeName}</strong> cam kết tiếp nhận và giải quyết mọi khiếu nại của người tiêu dùng liên quan đến việc thu thập, sử dụng và bảo mật thông tin cá nhân theo quy trình sau:
            </p>
            <ul>
              <li><strong>Bước 1 — Tiếp nhận:</strong> Quý khách gửi khiếu nại qua Hotline <strong>{s.storePhone}</strong>, Email <strong>{s.storeEmail}</strong> hoặc đến trực tiếp địa chỉ <strong>{s.storeAddress}</strong>.</li>
              <li><strong>Bước 2 — Xác nhận:</strong> Trong vòng <strong>24 giờ làm việc</strong>, chúng tôi sẽ phản hồi xác nhận đã nhận được khiếu nại và thông báo thời gian giải quyết dự kiến.</li>
              <li><strong>Bước 3 — Xử lý:</strong> Trong vòng <strong>3–5 ngày làm việc</strong>, bộ phận phụ trách sẽ điều tra và đưa ra phương án giải quyết cụ thể (chỉnh sửa thông tin, xóa dữ liệu, hoặc giải thích rõ lý do).</li>
              <li><strong>Bước 4 — Thông báo kết quả:</strong> Chúng tôi thông báo kết quả giải quyết đến quý khách bằng phương thức liên lạc mà quý khách đã cung cấp.</li>
            </ul>
            <p>
              Trong trường hợp không đạt được thỏa thuận, quý khách có quyền khiếu nại đến cơ quan quản lý nhà nước có thẩm quyền về bảo vệ người tiêu dùng theo quy định pháp luật Việt Nam.
            </p>
          </section>

          <section>
            <h2>8. Thông tin liên hệ</h2>
            <p>
              Nếu quý khách có bất kỳ thắc mắc hay khiếu nại nào liên quan đến chính sách bảo mật này, xin vui lòng liên hệ với chúng tôi qua:
            </p>
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
