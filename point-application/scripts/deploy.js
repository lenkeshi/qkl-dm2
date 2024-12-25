const hre = require("hardhat");

async function main() {
  // 获取合约工厂
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 UniversalPoints 合约 (通用积分合约)
  const UniversalPoints = await hre.ethers.getContractFactory("UniversalPoints");
  const initialSupply = hre.ethers.utils.parseUnits("1000000", 18); // 发行初始的 1000000 UPT
  const universalPoints = await UniversalPoints.deploy(initialSupply);
  console.log("UniversalPoints contract deployed to:", universalPoints.address);
  console.log("Initial supply of UPT:", hre.ethers.utils.formatUnits(initialSupply, 18)); // 格式化并打印初始供应量


  // 部署 PointsExchange 合约 (积分兑换合约)
  const PointsExchange = await hre.ethers.getContractFactory("PointsExchange");
  const pointsExchange = await PointsExchange.deploy(universalPoints.address);  // 将 UPT 合约地址传入
  console.log("PointsExchange contract deployed to:", pointsExchange.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
