const { SlashCommandBuilder } = require("discord.js");
const { addObjectQuantity, searchObjects } = require("../../db/objects");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ajouter")
    .setDescription("Ajoute un objet au coffre.")
    .addStringOption(
      (option) =>
        option
          .setName("objet")
          .setDescription("L'objet à ajouter.")
          .setRequired(true)
          .setAutocomplete(true), // <= important
    )
    .addIntegerOption((option) =>
      option
        .setName("quantite")
        .setDescription("Quantité à ajouter")
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
    const updatedObject = addObjectQuantity(objet, quantite);

    if (!updatedObject) {
      await interaction.reply(`❌ Objet inconnu : **${objet}**.`);
      return;
    }

    await interaction.reply(
      `✅ Ajouté **${quantite}** × **${updatedObject.name}** au coffre. Total: **${updatedObject.quantity}**.`,
    );
  },
};
