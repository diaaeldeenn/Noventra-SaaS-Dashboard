import userModel from "../models/user.model.js";
import { Hash } from "../../../common/utils/security/hash.security.js";
import { RoleEnum } from "../../../common/enum/user.enum.js";

export const seedAdmin = async () => {
  try {
    const adminExists = await userModel.findOne({ role: RoleEnum.admin });
    if (!adminExists) {
      console.log(" No Admin found. Seeding first Admin account...");
      await userModel.create({
        name: "Diaa Eldeen",
        email: "diaaelseady@gmail.com",
        password: Hash({ plainText: "Diaa12345" }),
        role: RoleEnum.admin,
        isActive: true,
      });

      console.log("First Admin seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};
