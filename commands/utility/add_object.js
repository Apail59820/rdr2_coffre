const { SlashCommandBuilder } = require("discord.js");

const items = [  { name: "Plantes", value: "plants" },
  { name: "Eau purifié", value: "purified_water" },
  { name: "Tabac indien", value: "indian_tobacco" },
  { name: "Miel", value: "honey" },
  { name: "Petite carcasse", value: "small_carcass" },
  { name: "Grosse carcasse", value: "large_carcass" },
  { name: "Plume", value: "feather" },
  { name: "Viande", value: "meat" },
  { name: "Cuir traité", value: "treated_leather" },
  { name: "Huile de poisson", value: "fish_oil" },
  { name: "Bois", value: "wood" },
  { name: "Pierre", value: "stone" },
  { name: "Métal", value: "metal" },
  { name: "Minerai", value: "ore" },
  { name: "Coton tissé", value: "woven_cotton" },
  { name: "Kit ancestral", value: "ancestral_kit" },
  { name: "(nourriture) Sagamite", value: "sagamite" },
  { name: "(boisson) Thé Natif", value: "native_tea" },
  { name: "Menthe", value: "mint" },
  { name: "Cassis", value: "blackcurrant" },
  { name: "Thym", value: "thyme" },
  { name: "Fraise", value: "strawberry" },
  { name: "Riz", value: "rice" },
  { name: "Pavot", value: "poppy" },
  { name: "Gingembre", value: "ginger" }
]

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ajouter")
    .setDescription("Ajoute un objet au coffre.")
    .addStringOption(option =>
      option
        .setName("objet")
        .setDescription("L'objet à ajouter.")
        .setRequired(true)
        .setAutocomplete(true) // <= important
    )
    .addIntegerOption(option =>
      option
        .setName("quantite")
        .setDescription("Quantité à ajouter")
        .setRequired(true)
        .setMinValue(1)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const query = focused.value.toLowerCase();

    const filtered = items
      .filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.value.toLowerCase().includes(query)
      )
      .slice(0, 25)
      .map(i => ({ name: i.name, value: i.value }));

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const objet = interaction.options.getString("objet", true);
    const quantite = interaction.options.getInteger("quantite", true);

    await interaction.reply(`✅ Ajouté **${quantite}** × **${objet}** au coffre.`);
  },
};