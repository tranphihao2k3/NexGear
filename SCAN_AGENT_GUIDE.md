# Hướng Dẫn Tự Động Quét Cấu Hình Laptop

## Tổng Quan

Hệ thống cho phép người dùng quét cấu hình máy tính Windows tự động và điền vào form thu cũ đổi mới. Khi người dùng nhấn nút "Tự Động Điền Cấu Hình", hệ thống sẽ:

1. Tạo session token (10 phút, dùng 1 lần)
2. Tải file `scan-agent.exe` về máy
3. Người dùng chạy file exe → tự động đọc hardware qua WMI → gửi lên server
4. Server nhận data → Pusher push realtime → form tự động điền

## Kiến Trúc

```
User → Web (Next.js) → API (/api/scan/create-session) → MongoDB (ScanSession)
                                      ↓
                              File scan-agent.exe (C# .NET 8)
                                      ↓
                         API (/api/scan/submit) → MongoDB + Pusher
                                      ↓
                         Web nhận realtime → Điền form
```

## Backend API

### 1. `/api/scan/create-session` (POST)

Tạo session token mới:

```typescript
// Response
{
  "success": true,
  "data": {
    "token": "uuid-v4",
    "downloadUrl": "/scan-agent.exe",
    "expiresAt": "2026-05-18T14:02:41Z"
  }
}
```

### 2. `/api/scan/submit` (POST)

Nhận data từ exe:

```typescript
// Request body
{
  "token": "uuid-v4",
  "hardware": {
    "cpu": { "name": "Intel Core i7-12700H", "cores": "14", "speed": "2300" },
    "ram": { "total": "16 GB", "type": "DDR5" },
    "gpu": { "name": "NVIDIA RTX 3060", "vram": "6 GB" },
    "storage": {
      "drives": [
        { "name": "Samsung SSD 970 EVO", "size": "512 GB", "type": "NVMe" }
      ]
    },
    "system": {
      "manufacturer": "Dell",
      "model": "G15 5515",
      "os": "Windows 11 Home"
    }
  }
}
```

## File Exe (C# .NET 8)

### Yêu cầu

- .NET 8 SDK
- Windows 10/11 (WMI chỉ có trên Windows)

### Code mẫu `Program.cs`

```csharp
using System;
using System.Management;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("=== Scan Agent v1.0 ===\n");

        string token = GetToken(args);

        Console.WriteLine("Đang đọc thông số phần cứng...");
        var hardware = new
        {
            cpu = GetCpu(),
            ram = GetRam(),
            gpu = GetGpu(),
            storage = GetStorage(),
            system = GetSystemInfo()
        };

        Console.WriteLine("Đang gửi dữ liệu lên server...");
        await SubmitData(token, hardware);

        Console.WriteLine("\n✓ Đã gửi thành công! Quay lại trình duyệt để xem kết quả.");
        Console.WriteLine("Nhấn phím bất kỳ để đóng...");
        Console.ReadKey();
    }

    static string GetToken(string[] args)
    {
        if (args.Length > 0)
        {
            Console.WriteLine("Token từ argument: " + args[0]);
            return args[0];
        }

        Console.WriteLine("Không tìm thấy token trong argument.");
        Console.Write("Vui lòng nhập token: ");
        string? token = Console.ReadLine();
        if (!string.IsNullOrWhiteSpace(token)) return token;

        Console.WriteLine("Token không hợp lệ!");
        Environment.Exit(1);
        return string.Empty;
    }

    static object GetCpu()
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor");
        var cpu = searcher.Get().Cast<ManagementObject>().FirstOrDefault();
        return new
        {
            name = cpu?["Name"]?.ToString(),
            cores = cpu?["NumberOfCores"]?.ToString(),
            speed = cpu?["MaxClockSpeed"]?.ToString()
        };
    }

    static object GetRam()
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemory");
        var modules = searcher.Get().Cast<ManagementObject>().ToList();
        var total = modules.Sum(m => (ulong)m["Capacity"]);
        var type = modules.FirstOrDefault()?["SMBIOSMemoryType"]?.ToString();
        return new
        {
            total = $"{total / (1024UL * 1024 * 1024)} GB",
            type = GetMemoryType(type)
        };
    }

    static object GetGpu()
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController");
        var gpu = searcher.Get().Cast<ManagementObject>().FirstOrDefault();
        return new
        {
            name = gpu?["Name"]?.ToString(),
            vram = gpu?["AdapterRAM"]?.ToString()
        };
    }

    static object GetStorage()
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive");
        var drives = searcher.Get().Cast<ManagementObject>()
            .Select(d => new
            {
                name = d["Model"]?.ToString(),
                size = $"{(ulong)d["Size"] / (1024UL * 1024 * 1024)} GB",
                type = d["MediaType"]?.ToString() ?? "HDD"
            })
            .ToList();
        return new { drives };
    }

    static object GetSystemInfo()
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem");
        var system = searcher.Get().Cast<ManagementObject>().FirstOrDefault();

        using var osSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_OperatingSystem");
        var os = osSearcher.Get().Cast<ManagementObject>().FirstOrDefault();

        return new
        {
            manufacturer = system?["Manufacturer"]?.ToString(),
            model = system?["Model"]?.ToString(),
            os = os?["Caption"]?.ToString()
        };
    }

    static string GetMemoryType(string? type)
    {
        return type switch
        {
            "20" => "DDR",
            "21" => "DDR2",
            "24" => "DDR3",
            "26" => "DDR4",
            "30" => "DDR5",
            _ => "Unknown"
        };
    }

    static async Task SubmitData(string token, object hardware)
    {
        var client = new HttpClient();
        var data = new { token, hardware };
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://yoursite.com/api/scan/submit", content);
        response.EnsureSuccessStatusCode();
    }
}
```

### Build file exe

```bash
dotnet publish -r win-x64 -p:PublishSingleFile=true --self-contained false
```

File output: `bin/Debug/net8.0/win-x64/publish/scan-agent.exe`

## Frontend Integration

### 1. Tạo session & copy token

```typescript
const { token, downloadUrl } = await fetch('/api/scan/create-session', {
    method: 'POST'
}).then(r => r.json());

await navigator.clipboard.writeText(token);
window.location.href = downloadUrl;
```

### 2. Subscribe Pusher & chờ kết quả

```typescript
const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

const channel = pusher.subscribe(`scan-${token}`);

channel.bind('scan-complete', (data: any) => {
    setFormData(prev => ({
        ...prev,
        model: data.hardware.system?.manufacturer,
        cpu: data.hardware.cpu?.name,
        ram: data.hardware.ram?.total,
        gpu: data.hardware.gpu?.name,
        ssd: data.hardware.storage?.drives?.[0]?.size,
    }));
});
```

## Bảo Mật

1. **Token one-time**: Mỗi token chỉ dùng 1 lần, hết hạn sau 10 phút
2. **HTTPS bắt buộc**: Tất cả request phải qua HTTPS
3. **Không ghi file**: Exe chỉ đọc hardware, không ghi/deletes file nào
4. **Không lưu serial**: Không lưu serial number nếu không cần thiết (GDPR)
5. **Code signing**: Ký số file exe để tránh SmartScreen warning

## Troubleshooting

### Exe không gửi được data

- Kiểm tra firewall có chặn outbound không
- Đảm bảo URL API đúng trong code
- Kiểm tra token có đúng không

### Form không nhận được realtime

- Kiểm tra Pusher key/cluster có đúng không
- Đảm bảo channel name = `scan-${token}`
- Kiểm tra console browser có lỗi gì không

### WMI không đọc được hardware

- Chạy exe với quyền Administrator
- Kiểm tra Windows Management Instrumentation service đang chạy

## Mở Rộng

- [ ] Thêm tính năng "Lưu lịch sử scan"
- [ ] Gợi ý nâng cấp (nếu RAM < 16GB → gợi ý RAM kit)
- [ ] So sánh máy cũ vs laptop mới đang bán
- [ ] Trade-in estimate dựa trên spec
