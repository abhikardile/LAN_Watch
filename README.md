# 🌐 LAN Watch - Network Monitoring System

A real-time network monitoring and packet analysis tool that captures network traffic, analyzes packets, and provides insights into network activity. The project helps monitor TCP, UDP, ICMP, and DNS traffic for troubleshooting, security analysis, and educational purposes. It captures live packets using Scapy and extracts source/destination IP addresses, ports, and protocol information. :contentReference[oaicite:0]{index=0}

---

## 🚀 Features

- 📡 Live Network Packet Capture
- 🌍 Source & Destination IP Detection
- 🔌 TCP, UDP & ICMP Protocol Analysis
- 🔍 DNS Query Detection
- 📊 Real-time Packet Monitoring
- ⚡ Lightweight & Fast Packet Processing
- 🖥️ Command Line Interface
- 🛡️ Helpful for Network Troubleshooting & Security Analysis

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Socket.IO

### Networking
- Python
- Scapy

---

## 📂 Project Structure

```
network-monitor/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
│
└── sniffer.py
```

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/abhikardile/LAN_Watch.git
```

```bash
cd LAN_Watch
```

---

### Install Frontend

```bash
cd frontend
npm install
```

---

### Install Backend

```bash
cd ../backend
npm install
```

---

### Install Python Dependencies

```bash
pip install scapy
```

---

## ▶️ Run the Project

### Start Backend

```bash
cd backend
npm start
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Run Packet Sniffer

```bash
python sniffer.py
```

or

```bash
sudo python3 sniffer.py
```

The packet sniffer supports selecting a network interface, applying BPF filters, and limiting the number of captured packets through command-line options. :contentReference[oaicite:1]{index=1}

---

## 📸 Screenshots

Add screenshots of:

- Dashboard
- Live Packet Monitoring
- Network Statistics
- Alerts
- Traffic Analysis

---

## 🔍 Future Improvements

- Authentication System
- Email Alerts
- Network Visualization Charts
- Intrusion Detection
- Packet Storage Database
- Export Reports
- Device Discovery
- Threat Detection

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to your branch.
5. Create a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Abhishek Kardile**

- GitHub: https://github.com/abhikardile
- LinkedIn: *(Add your LinkedIn profile)*

---

⭐ If you like this project, don't forget to **Star** the repository!
