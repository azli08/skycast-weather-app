# SkyCast — Weather App

Şehirlerin güncel hava durumunu ve beş günlük tahminini gösteren responsive hava durumu uygulaması. Arayüz Türkçedir; sıcaklık birimi °C ve °F olarak değiştirilebilir.

## Özellikler

- Güncel sıcaklık, hissedilen sıcaklık, nem ve rüzgâr bilgileri
- Beş günlük en düşük/en yüksek sıcaklık tahmini
- °C / °F seçimi
- Türkçe tarih ve hava durumu açıklamaları
- Mobil uyumlu arayüz, klavye odağı ve ekran okuyucu durum mesajları
- Sunucu tarafında API proxy'si ve temel istek sınırı

## Yerelde çalıştırma

Gereksinim: Node.js 18 veya üzeri.

1. `.env.example` dosyasını `.env` adıyla kopyala.
2. `.env` içindeki `WEATHER_API_KEY` değerini kendi [WeatherAPI](https://www.weatherapi.com/) anahtarınla değiştir.
3. Terminalde proje klasöründe `npm start` komutunu çalıştır.
4. Tarayıcıda `http://localhost:3000` adresini aç.

`.env` dosyası `.gitignore` ile Git dışında tutulur. Gerçek API anahtarını hiçbir zaman repoya ekleme. Daha önce kaynak kodda bulunan anahtarı WeatherAPI panelinden iptal edip yenile.

## Yayınlama

Uygulama, Node.js 18+ çalıştırabilen bir sunucuya (ör. Render, Railway veya kendi sunucun) dağıtılabilir. Yayın ortamının Environment Variables ayarına `WEATHER_API_KEY` ekle ve başlatma komutu olarak `npm start` kullan. GitHub Pages gibi yalnızca statik dosya sunan servisler bu sunucu proxy'sini çalıştıramaz.

Sunucu, aynı IP adresinden dakikada 30 hava durumu isteğine izin veren basit bir bellek içi sınır uygular. Birden fazla sunucu örneği veya yoğun trafik için bu sınır Redis gibi ortak bir depoya taşınmalıdır.

## Teknolojiler

- HTML, CSS ve Vanilla JavaScript
- Node.js yerleşik HTTP sunucusu (ek bağımlılık yok)
- [WeatherAPI](https://www.weatherapi.com/)
