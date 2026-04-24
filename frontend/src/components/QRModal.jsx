import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { formatPrice } from '../utils/currency';

export default function QRModal({ service, onClose, darkMode, pickup, dropoff, language = 'en' }) {
  const t = (key) => getTranslation(key, language);
  
  // Generate booking link for QR code (deep links with location data)
  const generateBookingLink = () => {
    const pickupLat = pickup?.lat || '';
    const pickupLon = pickup?.lon || '';
    const dropoffLat = dropoff?.lat || '';
    const dropoffLon = dropoff?.lon || '';
    const pickupName = encodeURIComponent(pickup?.name || '');
    const dropoffName = encodeURIComponent(dropoff?.name || '');

    switch (service.name) {
      case 'Uber':
        // Uber universal deep link (opens app with prefilled locations)
        return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLon}&pickup[nickname]=${pickupName}&pickup[formatted_address]=${pickupName}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLon}&dropoff[nickname]=${dropoffName}&dropoff[formatted_address]=${dropoffName}&client_id=RideWise`;
      
      case 'Rapido':
        // Rapido universal link - opens app if installed, web if not
        return `https://rapido.bike`;
      
      case 'Namma Yatri':
        // Namma Yatri deep link - opens app with pre-filled locations (for QR code)
        return `https://nammayatri.in/link/?srcLat=${pickupLat}&srcLon=${pickupLon}&destLat=${dropoffLat}&destLon=${dropoffLon}&srcAddress=${pickupName}&destAddress=${dropoffName}`;
      
      default:
        // Fallback to Google Maps directions
        return `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLon}&destination=${dropoffLat},${dropoffLon}&travelmode=driving`;
    }
  };

  // Generate button link (simple URLs for browser)
  const generateButtonLink = () => {
    if (service.name === 'Namma Yatri') {
      // Simple website link for button - works in browser
      return 'https://nammayatri.in/';
    }
    // For other services, use the same deep link
    return generateBookingLink();
  };

  const bookingLink = generateBookingLink(); // For QR code
  const buttonLink = generateButtonLink(); // For button

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className={`relative w-full max-w-md rounded-[32px] p-8 shadow-2xl ${
        darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-all ${
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
        >
          <X size={20} className={darkMode ? 'text-slate-400' : 'text-slate-600'} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${service.brand} rounded-2xl mb-4 shadow-lg`}>
            <span className="text-2xl font-black text-white">{service.name[0]}</span>
          </div>
          <h3 className={`text-2xl font-black uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {service.name}
          </h3>
          <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {service.type}
          </p>
        </div>

        {/* QR Code */}
        <div className={`flex justify-center p-6 rounded-2xl mb-6 ${
          darkMode ? 'bg-slate-950/50' : 'bg-slate-50'
        }`}>
          <div className="bg-white p-4 rounded-xl shadow-inner">
            <QRCodeSVG 
              value={bookingLink}
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className={`rounded-2xl p-4 mb-6 ${
          darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <Smartphone size={20} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {t('howToBook')}
              </h4>
              <ol className={`text-xs space-y-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <li>1. {t('openCamera')}</li>
                <li>2. {t('pointAtQR')}</li>
                <li>3. {service.name} {t('appOpens')} {service.name === 'Rapido' ? t('enterLocationsManually') : t('withRouteDetails')}</li>
                <li>4. {service.name === 'Rapido' ? t('enterPickupDropoff') : t('verifyLocations')}</li>
                <li>5. {t('selectAndBook')} {service.type} {t('completeBooking')}</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className={`text-center p-4 rounded-2xl mb-4 ${
          darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            {t('estimatedPrice')}
          </p>
          <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {formatPrice(service.price)}
          </p>
          <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
            {t('actualPriceVary')}
          </p>
        </div>

        {/* Open App Button */}
        <a
          href={buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full py-4 rounded-2xl font-black uppercase text-center transition-all shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
          }`}
        >
          {t('openApp')} {service.name}
        </a>

        <p className={`text-center text-[10px] mt-4 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>
          {service.name === 'Rapido' 
            ? t('opensEnterManually') 
            : `${t('opensWithRoute')} ${service.name} ${t('pricesMayVary')}`}
        </p>
      </div>
    </div>
  );
}
