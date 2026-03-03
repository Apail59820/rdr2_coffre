const { SlashCommandBuilder } = require("discord.js");
const { removeObjectQuantity, searchObjects } = require("../../db/objects");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("retirer")
    .setDescription("Retire un objet du coffre.")
    .addStringOption(
      (option) =>
        option
          .setName("objet")
          .setDescription("L'objet à retirer.")
          .setRequired(true)
          .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantite")
        .setDescription("Quantité à retirer")
        .setRequired(true)
        .setMinValue(1),
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const query = focused.value.toLowerCase();

    const filtered = searchObjects(query).map((object) => ({
      name: object.name,
      value: object.value,
    }));

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const objet = interaction.options.getString("objet", true);
    const quantite = interaction.options.getInteger("quantite", true);
    const updatedObject = removeObjectQuantity(objet, quantite);

    if (!updatedObject) {
      await interaction.reply(`❌ Objet inconnu : **${objet}**.`);
      return;
    }

    if (updatedObject.hasInsufficientQuantity) {
      await interaction.reply(
        `❌ Impossible de retirer **${quantite}** × **${updatedObject.name}** : stock disponible **${updatedObject.quantity}**.`,
      );
      return;
    }

    if (updatedObject.removedQuantity === 0) {
      await interaction.reply(
        `ℹ️ **${updatedObject.name}** est déjà à **0** dans le coffre.`,
      );
      return;
    }

    const previousQuantity =
      updatedObject.quantity + updatedObject.removedQuantity;
    const isBelowThreshold =
      updatedObject.threshold > 0 &&
      updatedObject.quantity < updatedObject.threshold;
    const crossedThreshold =
      isBelowThreshold && previousQuantity >= updatedObject.threshold;

    let replyMessage = `✅ Retiré **${updatedObject.removedQuantity}** × **${updatedObject.name}** du coffre. Total: **${updatedObject.quantity}**.`;

    if (crossedThreshold) {
      replyMessage += `\n⚠️ **${updatedObject.name}** vient de passer sous son seuil (**${updatedObject.threshold}**).`;
    } else if (isBelowThreshold) {
      replyMessage += `\n⚠️ **${updatedObject.name}** est sous son seuil (**${updatedObject.threshold}**).`;
    }

    await interaction.reply(replyMessage);
  },
};
