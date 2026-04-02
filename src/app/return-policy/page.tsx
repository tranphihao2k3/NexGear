import styles from './page.module.scss';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return {
    title: `Chính sách đổi trả hàng | ${s.storeName}`,
    description: `Quy định chi tiết về việc đổi và trả sản phẩm tại ${s.storeName}. Bảo vệ quyền lợi người tiêu dùng với quy trình xử lý minh bạch trong 7 ngày.`,
  };
}

export default async function ReturnPolicyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  const lastUpdate = '02/04/2026';

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.label}>{s.storeName} SUPPORT</span>
          <h1 className={styles.title}>Chính sách đổi trả hàng</h1>
        </header>

        <article className={styles.content}>
          <section>
            <p>
              Nhằm mang lại sự an tâm tuyệt đối khi mua sắm, <strong>{s.storeName}</strong> áp dụng chính sách <strong>đổi trả hàng trong vòng 7 ngày</strong> linh hoạt dành cho khách hàng. Chúng tôi hiểu rằng việc chọn mua Gear đôi khi cần trải nghiệm thực tế, và chúng tôi cam kết hỗ trợ tối đa nếu sản phẩm chưa làm bạn hài lòng.
            </p>
          </section>

          <section>
            <h2>1. Quy định đổi hàng (Đổi sản phẩm khác)</h2>
            <p>Quý khách có thể đổi sang sản phẩm khác cùng loại hoặc đổi sang mẫu khác tại <strong>{s.storeName}</strong>:</p>
            <ul>
              <li><strong>Thời gian:</strong> Trong 7 ngày kể từ ngày nhận hàng.</li>
              <li><strong>Điều kiện:</strong> Sản phẩm còn nguyên tem bảo hành, đầy đủ hộp, phụ kiện, quà tặng kèm theo. Sản phẩm chưa có dấu hiệu trầy xước, va đập hoặc có dấu hiệu can thiệp kỹ thuật.</li>
              <li><strong>Lưu ý:</strong> Quý khách sẽ bù chênh lệch nếu sản phẩm mới có giá cao hơn. Trường hợp sản phẩm mới có giá thấp hơn, phần chênh lệch sẽ được quy đổi thành Voucher cho lần mua sau.</li>
            </ul>
          </section>

          <section>
            <h2>2. Quy định trả hàng (Hoàn tiền)</h2>
            <p>Việc trả hàng hoàn tiền chỉ được áp dụng trong các trường hợp sau:</p>
            <ul>
              <li>Sản phẩm gặp lỗi kỹ thuật từ nhà sản xuất nhưng không có sản phẩm khác để đổi hoặc khách hàng không còn nhu cầu sử dụng.</li>
              <li>Sản phẩm giao không đúng mẫu mã, màu sắc, thông số kỹ thuật như khách hàng đã đặt.</li>
              <li>Sản phẩm bị bể vỡ, móp méo ngay khi nhận hàng (có biên bản đồng kiểm với shipper hoặc video mở hộp).</li>
              <li><strong>Thời gian xử lý hoàn tiền:</strong> Trong 3 - 5 ngày làm việc kể từ khi <strong>{s.storeName}</strong> nhận lại hàng và kiểm tra hợp lệ. Hoàn tiền qua hình thức chuyển khoản ngân hàng.</li>
            </ul>
          </section>

          <section>
            <h2>3. Điều kiện đổi trả hàng</h2>
            <p>Sản phẩm gửi về đổi trả phải đáp ứng đầy đủ các yêu cầu:</p>
            <ul>
              <li>Sản phẩm còn đầy đủ hộp (box) và các phụ kiện đi kèm (HDSD, cáp, switch puller, keycap kèm theo...).</li>
              <li>Sản phẩm không bị trầy xước, bụi bẩn, có mùi lạ hoặc có dấu hiệu đã qua sử dụng lâu ngày.</li>
              <li>Tem bảo hành và tem niêm phong còn nguyên vẹn, không bị rách, tẩy xóa.</li>
              <li>Có đầy đủ hóa đơn mua hàng hoặc cung cấp đúng số điện thoại đặt hàng để đối soát hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2>4. Chi phí vận chuyển đổi trả</h2>
            <ul>
              <li><strong>Lỗi do {s.storeName}:</strong> (Giao sai hàng, hàng lỗi kỹ thuật, hàng bể vỡ...) <strong>{s.storeName}</strong> chịu toàn bộ chi phí vận chuyển thu hồi và gửi lại sản phẩm mới.</li>
              <li><strong>Lỗi do nhu cầu cá nhân:</strong> (Không ưng ý mẫu mã, muốn đổi mẫu khác...) Khách hàng chịu chi phí vận chuyển 2 chiều và phí xử lý (nếu có).</li>
            </ul>
          </section>

          <section>
            <h2>5. Các sản phẩm hạn chế đổi trả</h2>
            <p>Tùy theo tính chất đặc thù, một số sản phẩm sẽ không được áp dụng chính sách đổi trả (trừ trường hợp lỗi kỹ thuật):</p>
            <ul>
              <li>Các sản phẩm tiêu hao (Lube, dung dịch vệ sinh, sticker...).</li>
              <li>Sản phẩm nằm trong chương trình Flash Sale, xả kho giá sốc có ghi chú "Không đổi trả".</li>
              <li>Sản phẩm quà tặng kèm theo.</li>
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
