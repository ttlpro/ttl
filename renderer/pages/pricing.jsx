import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import StaticLayout from '../components/StaticLayout';

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  
  // Helper function to format numbers based on current language
  const formatNumber = (value) => {
    const localeMap = {
      'vi': 'vi-VN',
      'en': 'en-US',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'th': 'th-TH',
      'fr': 'fr-FR'
    };
    const locale = localeMap[i18n.language] || 'vi-VN';
    return new Intl.NumberFormat(locale).format(value);
  };

  // Helper function to get currency by language
  const getCurrency = () => {
    const currencyMap = {
      'vi': 'VNĐ',
      'en': 'USD',
      'zh': 'CNY',
      'ja': 'JPY',
      'ko': 'KRW',
      'th': 'THB',
      'fr': 'EUR'
    };
    return currencyMap[i18n.language] || 'VNĐ';
  };

  // Helper function to get currency exchange rate (base VND)
  const getCurrencyRate = () => {
    const rateMap = {
      'vi': 1,
      'en': 0.000039,  // 1 VND ≈ 0.000039 USD (updated Dec 2024)
      'zh': 0.00028,   // 1 VND ≈ 0.00028 CNY (updated Dec 2024)
      'ja': 0.0060,    // 1 VND ≈ 0.0060 JPY (updated Dec 2024)
      'ko': 0.056,     // 1 VND ≈ 0.056 KRW (updated Dec 2024)
      'th': 0.0013,    // 1 VND ≈ 0.0013 THB (updated Dec 2024)
      'fr': 0.000037   // 1 VND ≈ 0.000037 EUR (updated Dec 2024)
    };
    return rateMap[i18n.language] || 1;
  };

  // Helper function to convert VND to current currency
  const convertCurrency = (vndAmount) => {
    return vndAmount * getCurrencyRate();
  };

  // Helper function to format currency (assumes amount is already in VND)
  const formatCurrency = (amount) => {
    const currency = getCurrency();
    const convertedAmount = convertCurrency(amount);
    

    
    // Format with appropriate decimal places based on currency and amount
    let decimalPlaces = 2;
    if (currency === 'JPY' || currency === 'KRW') {
      decimalPlaces = 0;
    } else if (currency === 'USD' || currency === 'EUR') {
      // For very small amounts, show more decimal places
      if (convertedAmount < 0.01) {
        decimalPlaces = 6;
      } else if (convertedAmount < 1) {
        decimalPlaces = 4;
      }
    }
    
    const result = `${formatNumber(convertedAmount.toFixed(decimalPlaces))} ${currency}`;
    

    
    return result;
  };

  // Helper function to format currency (assumes amount is already in current currency)
  const formatCurrencyDirect = (amount) => {
    const currency = getCurrency();
    
    // Format with appropriate decimal places based on currency and amount
    let decimalPlaces = 2;
    if (currency === 'JPY' || currency === 'KRW') {
      decimalPlaces = 0;
    } else if (currency === 'USD' || currency === 'EUR') {
      // For very small amounts, show more decimal places
      if (amount < 0.01) {
        decimalPlaces = 6;
      } else if (amount < 1) {
        decimalPlaces = 4;
      }
    }
    
    return `${formatNumber(amount.toFixed(decimalPlaces))} ${currency}`;
  };

  // Helper function to format currency for revenue analysis table - compact format
  const formatCurrencyCompact = (amount) => {
    const currency = getCurrency();
    const convertedAmount = convertCurrency(amount);
    
    if (currency === 'VNĐ') {
      // VND compact format
      if (convertedAmount >= 1000000000) {
        return `${(convertedAmount / 1000000000).toFixed(1)}T ${currency}`;
      } else if (convertedAmount >= 1000000) {
        return `${(convertedAmount / 1000000).toFixed(1)}TR ${currency}`;
      } else if (convertedAmount >= 1000) {
        return `${(convertedAmount / 1000).toFixed(0)}K ${currency}`;
      }
      return `${formatNumber(convertedAmount)} ${currency}`;
    } else {
      // Other currencies - smart formatting
      let decimalPlaces = 2;
      let suffix = '';
      let displayAmount = convertedAmount;
      
      if (currency === 'JPY' || currency === 'KRW') {
        decimalPlaces = 0;
        if (convertedAmount >= 1000000) {
          displayAmount = convertedAmount / 1000000;
          suffix = 'M';
          decimalPlaces = 1;
        } else if (convertedAmount >= 1000) {
          displayAmount = convertedAmount / 1000;
          suffix = 'K';
          decimalPlaces = 0;
        }
      } else if (currency === 'USD' || currency === 'EUR') {
        if (convertedAmount >= 1000000) {
          displayAmount = convertedAmount / 1000000;
          suffix = 'M';
          decimalPlaces = 1;
        } else if (convertedAmount >= 1000) {
          displayAmount = convertedAmount / 1000;
          suffix = 'K';
          decimalPlaces = 1;
        } else if (convertedAmount < 0.01) {
          decimalPlaces = 6;
        } else if (convertedAmount < 1) {
          decimalPlaces = 4;
        }
      }
      
      return `${formatNumber(displayAmount.toFixed(decimalPlaces))}${suffix} ${currency}`;
    }
  };

  // Helper function to format currency - compact format (assumes amount is already in current currency)
  const formatCurrencyCompactDirect = (amount) => {
    const currency = getCurrency();
    
    if (currency === 'VNĐ') {
      // VND compact format
      if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}T`;
      } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}TR`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
      }
      return `${formatNumber(amount)}`;
    } else {
      // Other currencies - smart formatting
      let decimalPlaces = 2;
      let suffix = '';
      let displayAmount = amount;
      
      if (currency === 'JPY' || currency === 'KRW') {
        decimalPlaces = 0;
        if (amount >= 1000000) {
          displayAmount = amount / 1000000;
          suffix = 'M';
          decimalPlaces = 1;
        } else if (amount >= 1000) {
          displayAmount = amount / 1000;
          suffix = 'K';
          decimalPlaces = 0;
        }
      } else if (currency === 'USD' || currency === 'EUR') {
        if (amount >= 1000000) {
          displayAmount = amount / 1000000;
          suffix = 'M';
          decimalPlaces = 1;
        } else if (amount >= 1000) {
          displayAmount = amount / 1000;
          suffix = 'K';
          decimalPlaces = 1;
        } else if (amount < 0.01) {
          decimalPlaces = 6;
        } else if (amount < 1) {
          decimalPlaces = 4;
        }
      }
      
      return `${formatNumber(displayAmount.toFixed(decimalPlaces))}${suffix} ${currency}`;
    }
  };
  
  // Helper function to get default values based on currency
  const getDefaultValues = () => {
    const defaults = {
      'vi': { accountCost: 1500, proxyCost: 20000, revenueRate: 1.5 },
      'en': { accountCost: 0.06, proxyCost: 0.8, revenueRate: 0.000059 },     // USD equivalents (1.5 VND ≈ 0.000059 USD)
      'zh': { accountCost: 0.42, proxyCost: 5.6, revenueRate: 0.00042 },      // CNY equivalents
      'ja': { accountCost: 9, proxyCost: 120, revenueRate: 0.009 },           // JPY equivalents
      'ko': { accountCost: 84, proxyCost: 1120, revenueRate: 0.084 },         // KRW equivalents
      'th': { accountCost: 1.95, proxyCost: 26, revenueRate: 0.00195 },       // THB equivalents
      'fr': { accountCost: 0.055, proxyCost: 0.74, revenueRate: 0.000055 }    // EUR equivalents
    };
    return defaults[i18n.language] || defaults['vi'];
  };

  // State cho input parameters
  const [accountCost, setAccountCost] = useState(() => getDefaultValues().accountCost);
  const [proxyCost, setProxyCost] = useState(() => getDefaultValues().proxyCost);
  const [revenueRate, setRevenueRate] = useState(() => getDefaultValues().revenueRate);
  const [dailyMinutes, setDailyMinutes] = useState(360);
  
  // State cho data gói dịch vụ
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dữ liệu gói dịch vụ từ API
  useEffect(() => {
    fetchPackages();
  }, []);

  // Update default values when language changes
  useEffect(() => {
    const defaults = getDefaultValues();
    setAccountCost(defaults.accountCost);
    setProxyCost(defaults.proxyCost);
    setRevenueRate(defaults.revenueRate);
  }, [i18n.language]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://licensedb.amazingcpanel.com/api/app/license-types');
      const data = await response.json();
      
      if (data.success && data.data && data.data.licenseTypes) {
        setPackages(data.data.licenseTypes);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán cho từng gói
  const packageAnalysis = useMemo(() => {
    return packages.map(pkg => {
      const accounts = pkg.accounts;
      const proxies = Math.ceil(accounts / 5); // 5 accounts per proxy
      
      // Doanh thu
      const dailyRevenue = accounts * dailyMinutes * revenueRate;
      // console.log(dailyRevenue, accounts, dailyMinutes, revenueRate);
      const monthlyRevenue = dailyRevenue * 30;
      
      // Chi phí (chuyển đổi license cost từ VND sang currency hiện tại)
      const convertedLicensePrice = convertCurrency(pkg.price);
      const accountSetupCost = accounts * accountCost;
      const proxyMonthlyCost = proxies * proxyCost;
      const licenseMonthlyCost = convertedLicensePrice / pkg.duration * 30; // Phân bổ license cost theo tháng
      const firstMonthCost = accountSetupCost + proxyMonthlyCost + convertedLicensePrice;
      const monthlyCost = proxyMonthlyCost + licenseMonthlyCost; // Bao gồm proxy + license phân bổ
      
      // Lợi nhuận
      const monthlyProfit = monthlyRevenue - monthlyCost;
      const roi = monthlyCost > 0 ? (monthlyProfit / monthlyCost) * 100 : 0;
      
      // Điểm hòa vốn (phút/ngày cần thiết)
      const breakEvenMinutesPerDay = monthlyCost / (accounts * revenueRate * 30);
      const breakEvenHoursPerDay = breakEvenMinutesPerDay / 60;
      
      // Khả thi
      let feasibility = 'veryFeasible';
      if (breakEvenHoursPerDay > 14) feasibility = 'unfeasible';
      else if (breakEvenHoursPerDay > 6) feasibility = 'challenging';
      else if (breakEvenHoursPerDay > 4) feasibility = 'feasible';
      
      return {
        ...pkg,
        accounts,
        proxies,
        dailyRevenue,
        monthlyRevenue,
        accountSetupCost,
        proxyMonthlyCost,
        licenseMonthlyCost,
        convertedLicensePrice,
        firstMonthCost,
        monthlyCost,
        monthlyProfit,
        roi,
        breakEvenMinutesPerDay,
        breakEvenHoursPerDay,
        feasibility
      };
    });
  }, [packages, accountCost, proxyCost, revenueRate, dailyMinutes, i18n.language]);

  const handleReset = () => {
    const defaults = getDefaultValues();
    setAccountCost(defaults.accountCost);
    setProxyCost(defaults.proxyCost);
    setRevenueRate(defaults.revenueRate);
    setDailyMinutes(360);
  };

  const getFeasibilityColor = (feasibility) => {
    switch (feasibility) {
      case 'veryFeasible': return 'text-green-600 bg-green-50';
      case 'feasible': return 'text-blue-600 bg-blue-50';
      case 'challenging': return 'text-yellow-600 bg-yellow-50';
      case 'unfeasible': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProfitColor = (profit) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <StaticLayout activePage="pricing">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('pricing.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('pricing.subtitle')}
          </p>
        </div>

        
        {/* Bảng danh sách gói */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('pricing.packageTable.title')}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {t('pricing.packageTable.loading')}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{t('pricing.packageTable.error')}</p>
              <button
                onClick={fetchPackages}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('pricing.packageTable.retry')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.package')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.accounts')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.rooms')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.duration')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.licenseCost')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {packages.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pkg.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(pkg.accounts)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(pkg.rooms)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {t('pricing.packageTable.durationDays', { days: pkg.duration })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(pkg.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Chi phí cơ bản */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('pricing.basicCosts.title')}
            </h2>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t('pricing.basicCosts.reset')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('pricing.basicCosts.accountCost')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={accountCost}
                  onChange={(e) => setAccountCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {getCurrency()}/{t('pricing.basicCosts.accountCostUnit')}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('pricing.basicCosts.proxyCost')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={proxyCost}
                  onChange={(e) => setProxyCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {getCurrency()}/{t('pricing.basicCosts.proxyCostUnit')}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('pricing.basicCosts.revenue')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={revenueRate}
                  onChange={(e) => setRevenueRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {getCurrency()}/{t('pricing.basicCosts.revenueUnit')}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('pricing.basicCosts.dailyMinutes')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {t('pricing.basicCosts.dailyMinutesUnit')}
              </span>
            </div>
          </div>
        </div>

        {/* Bảng phân tích doanh thu */}
        {!loading && !error && packageAnalysis.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('pricing.revenueAnalysis.title')}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.package')}
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.packageTable.accounts')}
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.dailyRevenue')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.monthlyRevenue')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.firstMonthCost')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.proxyMonthlyCost')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.licenseMonthlyCost')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.monthlyCost')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.monthlyProfit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.revenueAnalysis.roi')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {packageAnalysis.map((analysis) => (
                    <tr key={analysis._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.name}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(analysis.accounts)}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(Math.round(analysis.dailyRevenue))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(Math.round(analysis.monthlyRevenue))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(analysis.firstMonthCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(Math.round(analysis.proxyMonthlyCost))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(Math.round(analysis.licenseMonthlyCost))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrencyCompactDirect(Math.round(analysis.monthlyCost))}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getProfitColor(analysis.monthlyProfit)}`}>
                        {formatCurrencyCompactDirect(Math.round(analysis.monthlyProfit))}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getProfitColor(analysis.roi)}`}>
                        {analysis.roi.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bảng phân tích điểm hòa vốn */}
        {!loading && !error && packageAnalysis.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('pricing.breakEven.title')}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.breakEven.package')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.breakEven.minutesPerDay')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.breakEven.hoursPerDay')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('pricing.breakEven.feasibility')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {packageAnalysis.map((analysis) => (
                    <tr key={analysis._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {analysis.breakEvenMinutesPerDay.toFixed(1)} {t('pricing.basicCosts.dailyMinutesUnit')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {analysis.breakEvenHoursPerDay.toFixed(1)} {t('pricing.breakEven.hoursUnit')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFeasibilityColor(analysis.feasibility)}`}>
                          {t(`pricing.breakEven.${analysis.feasibility}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StaticLayout>
  );
} 