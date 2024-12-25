import './App.css';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';

// 导入 ABI
import PointsExchangeABI from './abis/PointsExchange.json';
import RegularPointsABI from './abis/RegularPoints.json';
import UniversalPointsABI from './abis/UniversalPoints.json';

// 合约地址
const UNIVERSAL_POINTS_ADDRESS = "0x790Ed54f6c0A9c7e4ab68540C984ad0744a05503";
const POINTS_EXCHANGE_ADDRESS = "0x057f40784bc6CA34Af2F1658BD088112B6997C62";

// 合约所有者私钥（保存在 .env 文件中）
const contractOwnerPrivateKey = process.env.REACT_APP_PRIVATE_KEY;

const deployRegularPoints = async (signer, name, symbol) => {
  const RegularPointsFactory = new ethers.ContractFactory(
    RegularPointsABI.abi,
    RegularPointsABI.bytecode,
    signer
  );

  try {
    const regularPoints = await RegularPointsFactory.deploy(name, symbol);
    console.log("RegularPoints contract deployed to:", regularPoints.address);
    return regularPoints.address;
  } catch (error) {
    console.error("Deployment failed:", error);
  }
};

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [isWalletConnected, setIsWalletConnected] = useState(false); // 钱包连接状态

  const [regularPointsContract, setRegularPointsContract] = useState(null);
  const [universalPointsContract, setUniversalPointsContract] = useState(null);
  const [pointsExchangeContract, setPointsExchangeContract] = useState(null);

  const [amountToMint, setAmountToMint] = useState('');
  const [userPointsBalance, setUserPointsBalance] = useState('0');
  const [universalPointsBalance, setUniversalPointsBalance] = useState('0'); // 通用积分余额

  const [regularPointsAddress, setRegularPointsAddress] = useState(''); // 用户输入的合约地址

  const [exchangeRate, setExchangeRate] = useState('1'); // 默认兑换比例：1:1

  const [name, setName] = useState(""); // 用户输入的合约名称
  const [symbol, setSymbol] = useState(""); // 用户输入的合约符号

  // 连接到 MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      const newSigner = newProvider.getSigner();
      const newAccount = await newSigner.getAddress();
      setAccount(newAccount);
      setProvider(newProvider);
      setSigner(newSigner);
      setIsWalletConnected(true);
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    if (provider && signer) {
      const loadContracts = async () => {
        // 加载通用积分合约（UniversalPoints）
        const universalPoints = new ethers.Contract(UNIVERSAL_POINTS_ADDRESS, UniversalPointsABI.abi, signer);
        setUniversalPointsContract(universalPoints);

        // 加载积分兑换合约（PointsExchange）
        const pointsExchange = new ethers.Contract(POINTS_EXCHANGE_ADDRESS, PointsExchangeABI.abi, signer);
        setPointsExchangeContract(pointsExchange);

        // 获取通用积分余额
        const universalBalance = await universalPoints.balanceOf(account);
        setUniversalPointsBalance(ethers.utils.formatUnits(universalBalance, 18)); // 格式化并更新余额
      };
      loadContracts();
    }
  }, [provider, signer, account]);

  const loadRegularPointsContract = async (address) => {
    if (!ethers.utils.isAddress(address)) {
      alert('Invalid contract address');
      return;
    }
    try {
      const contract = new ethers.Contract(address, RegularPointsABI.abi, signer);
      const balance = await contract.balanceOf(account);
      setRegularPointsContract(contract);
      setUserPointsBalance(ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error("导入合约失败！", error);
      alert('导入合约失败！');
    }
  };

  const handleLoadContract = () => {
    if (regularPointsAddress) {
      loadRegularPointsContract(regularPointsAddress);
    } else {
      alert('请输入要导入的普通积分合约地址');
    }
  };

  const getPointsBalance = async () => {
    if (universalPointsContract && regularPointsContract && account) {
      // 获取通用积分余额
      const universalBalance = await universalPointsContract.balanceOf(account);
      setUniversalPointsBalance(ethers.utils.formatUnits(universalBalance, 18));

      // 获取普通积分余额
      const regularBalance = await regularPointsContract.balanceOf(account);
      setUserPointsBalance(ethers.utils.formatUnits(regularBalance, 18));
    }
  };

  const issueRegularPoints = async () => {
    if (!amountToMint) {
      alert('Please enter the amount to mint');
      return;
    }
    const mintAmount = ethers.utils.parseUnits(amountToMint, 18);
    try {
      const tx = await regularPointsContract.mint(account, mintAmount);
      await tx.wait();
      alert(`成功发行 ${amountToMint} ${symbol} 积分!`);
      getPointsBalance();
    } catch (err) {
      console.error(err);
      alert('发行失败！');
    }
  };

  const exchangePoints = async () => {
    if (!regularPointsAddress) {
      alert('请输入普通积分合约地址');
      return;
    }
    try {
      const rate = await pointsExchangeContract.exchangeRates(regularPointsContract.address);
      if (rate.eq(0)) {
        const newRate = prompt('请输入新的兑换比例 (例如：1 RPT = 2 UPT)');
        if (!newRate || isNaN(newRate)) {
          alert('请输入有效的兑换比例');
          return;
        }
        setExchangeRate(newRate);
        const txRate = await pointsExchangeContract.setExchangeRate(regularPointsContract.address, ethers.BigNumber.from(newRate));
        await txRate.wait();
        alert(`兑换比例已设置为 1 RPT = ${newRate} UPT`);
      }

      const amountToExchange = prompt('输入要兑换的普通积分数量:');
      if (!amountToExchange || isNaN(amountToExchange)) {
        alert('请输入有效的兑换数量');
        return;
      }
      const exchangeAmount = ethers.utils.parseUnits(amountToExchange, 18);
      await regularPointsContract.approve(pointsExchangeContract.address, exchangeAmount);
      const tx = await pointsExchangeContract.exchangeRPTToUPT(regularPointsContract.address, exchangeAmount);
      await tx.wait();
      alert('兑换成功！');
    } catch (err) {
      console.error('兑换失败:', err);
      alert('兑换失败！');
    }
  };

  const handleDeploy = async () => {
    if (!name || !symbol) {
      alert("请输入积分的名字和代号");
      return;
    }
    if (signer) {
      const contractAddress = await deployRegularPoints(signer, name, symbol);
      alert(`合约地址: ${contractAddress}`);
      const regularPoints = new ethers.Contract(contractAddress, RegularPointsABI.abi, signer);
      setRegularPointsContract(regularPoints);
    } else {
      alert("钱包未连接...");
    }
  };

  return (
    <div className="App">
      <h1>基于区块链的积分通兑平台</h1>
      
      {!isWalletConnected ? (
        <div>
          <button onClick={connectWallet}>连接钱包</button>
        </div>
      ) : (
        <div>
          {account && <p>连接账号: {account}</p>}
          <div>
            <h2>部署普通积分合约</h2>
            <input
              type="text"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <button onClick={handleDeploy}>部署通用积分发行合约</button>
          </div>

          <div>
            <h2>导入普通积分合约</h2>
            <input
              type="text"
              placeholder="contract address"
              value={regularPointsAddress}
              onChange={(e) => setRegularPointsAddress(e.target.value)}
            />
            <button onClick={handleLoadContract}>导入合约</button>
          </div>
  
                    <div>
            <h2>普通积分发行</h2>
            <input
              type="text"
              placeholder="amount to mint"
              value={amountToMint}
              onChange={(e) => setAmountToMint(e.target.value)}
            />
            <button onClick={issueRegularPoints}>发行积分</button>
          </div>

          <div>
            <h2>积分兑换</h2>
            <p>当前兑换比例: 1 {symbol} = {exchangeRate} UPT</p>
            <button onClick={exchangePoints}>兑换通用积分</button>
          </div>

          <div>
            <h2>查看余额</h2>
            <button onClick={getPointsBalance}>刷新余额</button>
            {regularPointsContract && (
              <p>您的 {symbol} 积分余额: {userPointsBalance}</p>
            )}
            <p>您的通用积分 (UPT) 余额: {universalPointsBalance}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;