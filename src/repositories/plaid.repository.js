const prisma = require("../utils/prisma");

const plaidAccount = await prisma.plaidAccount.findFirst({
  where: { userId },
});

module.exports = {
  plaidAccount,
};
