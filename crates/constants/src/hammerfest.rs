use etwin_core::hammerfest::{HammerfestItemId, HammerfestQuestId};
use once_cell::sync::Lazy;
use std::collections::HashMap;


pub struct HammerfestItem {
  pub id: HammerfestItemId,
  pub is_hidden: bool,
}

impl HammerfestItem {
  const unsafe fn new_unchecked(id: u16) -> Self {
    let is_hidden = matches!(id, 1186 | 1187 | 1188 | 1189);
    Self {
      id: HammerfestItemId::new_unchecked(id),
      is_hidden,
    }
  }
}

macro_rules! unchecked_hammerfest_item_list {
  ($($item:literal),* $(,)?) => {
    [ $(HammerfestItem::new_unchecked($item)),* ]
  }
}

#[rustfmt::skip]
pub const ITEMS: [HammerfestItem; 357] = unsafe {
  unchecked_hammerfest_item_list! [
    1000, 1003, 1008, 1013, 1017, 1027, 1041, 1043, 1047, 1048, 1049, 1050, 1051, 1169, 1185, 1022, 1024, 1025, 1026, 1028,
    1040, 1069, 1070, 1071, 1073, 1074, 1075, 1077, 1078, 1079, 1080, 1081, 1082, 1002, 1004, 1005, 1006, 1007, 1012, 1014,
    1015, 1016, 1018, 1019, 1023, 1045, 1046, 1009, 1010, 1011, 1001, 1021, 1042, 1055, 1056, 1057, 1142, 1149, 1166, 1020,
    1039, 1044, 1060, 1061, 1062, 1076, 1161, 1162, 1163, 1167, 1029, 1030, 1031, 1032, 1033, 1034, 1035, 1036, 1037, 1038,
    1164, 1052, 1053, 1054, 1091, 1092, 1093, 1094, 1095, 1096, 1097, 1098, 1099, 1063, 1064, 1065, 1066, 1067, 1068, 1083,
    1084, 1085, 1086, 1087, 1088, 1089, 1090, 1106, 1107, 1108, 1109, 1110, 1111, 1100, 1101, 1102, 1103, 1104, 1105, 1168,
    1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128, 1129, 1130, 1131,
    1132, 1133, 1134, 1135, 1136, 1141, 1143, 1137, 1138, 1139, 1140, 1144, 1145, 1146, 1147, 1148, 1150, 1151, 1152, 1153,
    1154, 1155, 1159, 1160, 1058, 1059, 1072, 1156, 1157, 1158, 1165, 1170, 1171, 1172, 1173, 1174, 1175, 1176, 1177, 1178,
    1179, 1180, 1181, 1182, 1183, 1184, 1190, 1191, 1194, 1197, 1198, 1199, 1200, 1193, 1196, 1192, 1195, 1201, 1202, 1203,
    1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1220, 1225, 1226, 1227,
    1237, 1238, 1221, 1222, 1223, 1224, 1228, 1236, 1229, 1230, 1231, 1232, 1233, 1234, 1235, 1186, 1187, 1188, 1189,    0,
       3,    4,    7,   13,   21,   24,   64,   74,   77,   84,  102,  113,  115,  116,  117,    1,    5,    8,   11,   18,
      22,   23,   25,   27,   28,   38,   39,   65,   66,   69,   71,   82,  106,  107,    2,    6,    9,   12,   19,   30,
      31,   36,   70,   72,   73,   75,   76,   80,   81,   86,   87,   88,   89,   90,   93,   95,   96,   99,  101,  112,
      14,   15,   16,   17,   32,   33,   34,   35,   40,   41,   42,   43,   44,   45,   46,   47,   48,   49,   50,   51,
      52,   53,   54,   55,   56,   57,   58,   59,   60,   61,   62,   63,  103,  104,  105,   20,   78,   79,   91,   94,
      83,   97,   98,  100,  108,   29,   37,   67,   85,   92,   68,   26,  109,  110,  111,   10,  114,
   ]
};

pub static ITEMS_BY_ID: Lazy<HashMap<HammerfestItemId, &'static HammerfestItem>> = Lazy::new(|| {
  let mut map: HashMap<HammerfestItemId, &'static HammerfestItem> = HashMap::new();
  for item in ITEMS.iter() {
    map.insert(item.id, item);
  }
  map
});

pub struct HammerfestQuest {
  pub id: HammerfestQuestId,
  pub title_fr: &'static str,
  pub title_en: &'static str,
  pub title_es: &'static str,
}

impl HammerfestQuest {
  const unsafe fn new_unchecked(
    id: u8,
    title_fr: &'static str,
    title_en: &'static str,
    title_es: &'static str,
  ) -> Self {
    Self {
      id: HammerfestQuestId::new_unchecked(id),
      title_fr,
      title_en,
      title_es,
    }
  }
}

#[rustfmt::skip]
pub const QUESTS: [HammerfestQuest; 76] = unsafe {
  [
    HammerfestQuest::new_unchecked(0, "Les constellations", "Constellations", "Las constelaciones"),
    HammerfestQuest::new_unchecked(1, "Mixtures du zodiaque", "Zodiac mixture", "Influencias del zodíaco"),
    HammerfestQuest::new_unchecked(2, "Premiers pas", "First steps", "Primeros pasos"),
    HammerfestQuest::new_unchecked(3, "L'aventure commence", "The adventure begins", "La aventura comienza"),
    HammerfestQuest::new_unchecked(4, "Une destinée épique", "An epic fate", "Un destino épico"),
    HammerfestQuest::new_unchecked(5, "Persévérance", "Perseverance", "Perseverancia"),
    HammerfestQuest::new_unchecked(6, "Gourmandise", "Delicacies", "Gourmand"),
    HammerfestQuest::new_unchecked(7, "Du sucre !", "Some sugar!", "¡Quiero algo dulce!"),
    HammerfestQuest::new_unchecked(8, "Malnutrition", "Malnutrition", "Malnutrición"),
    HammerfestQuest::new_unchecked(9, "Goût raffiné", "Good taste", "Gusto refinado"),
    HammerfestQuest::new_unchecked(10, "Avancée technologique", "Technological advance", "Avance tecnológico"),
    HammerfestQuest::new_unchecked(11, "Le petit guide des Champignons", "Small guide to mushrooms", "La pequeña guía de hongos"),
    HammerfestQuest::new_unchecked(12, "Trouver les pièces d'or secrètes !", "Find the secret golden coins!", "¡Encuentra las monedas de oro secretas!"),
    HammerfestQuest::new_unchecked(13, "Le grimoire des Etoiles", "The book of Magic Stars", "El grimorio de las Estrellas"),
    HammerfestQuest::new_unchecked(14, "Armageddon", "Armageddon", "Armageddon"),
    HammerfestQuest::new_unchecked(15, "Régime MotionTwin", "MotionTwin Diet", "Régimen MotionTwin"),
    HammerfestQuest::new_unchecked(16, "Créateur de jeu en devenir", "Creator of games", "Creador de juegos innovadores"),
    HammerfestQuest::new_unchecked(17, "La vie est une boîte de chocolats", "Life is like a box of chocolates...", "La vida es como una caja de bombones..."),
    HammerfestQuest::new_unchecked(18, "Le trésor Oune-difaïned", "Difaïned treasure", "El tesoro difaïned"),
    HammerfestQuest::new_unchecked(19, "Super size me !", "Super size me!", "Super size me!"),
    HammerfestQuest::new_unchecked(20, "Maître joaillier", "Master jeweller", "Maestro joyero"),
    HammerfestQuest::new_unchecked(21, "Grand prédateur", "Great Predator", "Gran Depredador"),
    HammerfestQuest::new_unchecked(22, "Expert en salades et potages", "Expert in salads and stews", "Experto en ensaladas y potajes"),
    HammerfestQuest::new_unchecked(23, "Festin d'Hammerfest", "Hammerfest Feast", "Festín de Hammerfest"),
    HammerfestQuest::new_unchecked(24, "Goûter d'anniversaire", "Birthday party", "Merienda de cumpleaños"),
    HammerfestQuest::new_unchecked(25, "Bon vivant", "Bon vivant", "Vividor"),
    HammerfestQuest::new_unchecked(26, "Fondue norvégienne", "Norwegian fondue", "Fondue noruega"),
    HammerfestQuest::new_unchecked(27, "Mystère de Guu", "Guu's mistery", "Misterio de Guu"),
    HammerfestQuest::new_unchecked(28, "Friandises divines", "Divine sweets", "Chucherías divinas"),
    HammerfestQuest::new_unchecked(29, "Igor et Cortex", "Igor and Cortex", "Igor y Cortex"),
    HammerfestQuest::new_unchecked(30, "Affronter l'obscurité", "Facing the darkness", "Afrontar la oscuridad"),
    HammerfestQuest::new_unchecked(31, "Et la lumière fût !", "And light appeared!", "¡Y se hizo la luz!"),
    HammerfestQuest::new_unchecked(32, "Noël sur Hammerfest !", "Christmas in Hammerfest!", "¡Navidad en Hammerfest!"),
    HammerfestQuest::new_unchecked(33, "Joyeux anniversaire Igor", "Happy birthday Igor", "Feliz cumpleaños Igor"),
    HammerfestQuest::new_unchecked(34, "Cadeau céleste", "Celestial present", "Regalo celestial"),
    HammerfestQuest::new_unchecked(35, "Achat de parties amélioré", "Game purchase enhanced", "Compra de partidas mejorada"),
    HammerfestQuest::new_unchecked(36, "Exterminateur de Sorbex", "Sorbex exterminator", "Exterminador de Sorbetex"),
    HammerfestQuest::new_unchecked(37, "Désamorceur de Bombinos", "Bombino disposal expert", "Desactivador de Bombinos"),
    HammerfestQuest::new_unchecked(38, "Tueur de poires", "Pear killer", "Asesino de peras"),
    HammerfestQuest::new_unchecked(39, "Mixeur de Tagadas", "Tagadas mixer", "Triturador de Tagadas"),
    HammerfestQuest::new_unchecked(40, "Kiwi frotte s'y pique", "Kiwi itches! ouch, it scratches!", "Kiwi rasca, vaya cómo pica..."),
    HammerfestQuest::new_unchecked(41, "Chasseur de Bondissantes", "Leaping Hunter", "Cazador de Sandinas"),
    HammerfestQuest::new_unchecked(42, "Tronçonneur d'Ananargeddons", "Armaggedon-Pineapple Killer", "Aniquilador de Piñaguedones"),
    HammerfestQuest::new_unchecked(43, "Roi de Hammerfest", "Hammerfest King", "Rey de Hammerfest"),
    HammerfestQuest::new_unchecked(44, "Chapelier fou", "Mad hatter", "Sombrero loco"),
    HammerfestQuest::new_unchecked(45, "Poney éco-terroriste", "Eco-terrorist pony", "Poni eco-terrorista"),
    HammerfestQuest::new_unchecked(46, "Le Pioupiouz est en toi", "The Pioupiou is in you", "El Pioupiouz está en ti"),
    HammerfestQuest::new_unchecked(47, "Chasseur de champignons", "Mushrooms hunter", "Cazador de champiñones"),
    HammerfestQuest::new_unchecked(48, "Successeur de Tuberculoz", "Tuber's successor", "Sucesor de Tubérculo"),
    HammerfestQuest::new_unchecked(49, "La première clé !", "The first Key!", "¡La primera Llave!"),
    HammerfestQuest::new_unchecked(50, "Rigor Dangerous", "Rigor Dangerous", "Rigor Dangerous"),
    HammerfestQuest::new_unchecked(51, "La Méluzzine perdue", "The lost Meluzin", "La Meluzine perdida"),
    HammerfestQuest::new_unchecked(52, "Enfin le Bourru !", "At last, the drunk man!", "¡Por fin el borracho!"),
    HammerfestQuest::new_unchecked(53, "Congélation", "Frozen", "Congelación"),
    HammerfestQuest::new_unchecked(54, "Une clé rouillée", "A rusty key", "Una llave herrumbrosa"),
    HammerfestQuest::new_unchecked(55, "Laissez passer !", "Let it go!", "¡Dejadlo libre!"),
    HammerfestQuest::new_unchecked(56, "Les mondes ardus", "The Arduous Worlds", "Los Mundos Arduos"),
    HammerfestQuest::new_unchecked(57, "Viiiite !", "Quickly!", "¡Ráaapido!"),
    HammerfestQuest::new_unchecked(58, "Faire les poches à Tubz", "Empty Tuber's pocket", "Vacíarle los bolsillos a Tubérculo"),
    HammerfestQuest::new_unchecked(59, "Tuberculoz, seigneur des enfers", "Tuber, Master of Hell", "Tubérculo, señor de los infiernos"),
    HammerfestQuest::new_unchecked(60, "L'eau ferrigineuneuse", "Metallic water", "El agua que sabe a perfume"),
    HammerfestQuest::new_unchecked(61, "Paperasse administrative", "Paperwork", "Papeleo"),
    HammerfestQuest::new_unchecked(62, "Meilleur joueur", "Best Player", "Mejor jugador"),
    HammerfestQuest::new_unchecked(63, "Miroir, mon beau miroir", "Mirror, my beautiful mirror", "Espejo, mi bonito espejo"),
    HammerfestQuest::new_unchecked(64, "Mode cauchemar", "Nightmare mode", "Modo pesadilla"),
    HammerfestQuest::new_unchecked(65, "L'aventure continue !", "The adventure continues!", "¡La aventura continúa!"),
    HammerfestQuest::new_unchecked(66, "Joyau d'Ankhel", "Ankhel Jewel", "Joya de Ankhel"),
    HammerfestQuest::new_unchecked(67, "Sandy commence l'aventure !", "Sandy's adventure begins!", "¡Sandy comienza la aventura!"),
    HammerfestQuest::new_unchecked(68, "Miroir, NOTRE beau miroir", "Mirror, OUR beautiful mirror", "Espejo, NUESTRO bonito espejo"),
    HammerfestQuest::new_unchecked(69, "Mode double cauchemar", "Double-nightmare option", "Modo Doble Pesadilla"),
    HammerfestQuest::new_unchecked(70, "Une grande Amitié", "A great Friendship", "Una gran Amistad"),
    HammerfestQuest::new_unchecked(71, "Apprentissage des canifs volants", "Learning how to launch Shurikens", "Aprendizaje de lanzamiento shurikens"),
    HammerfestQuest::new_unchecked(72, "Shinobi do !", "Shinobi do!", "¡Shinobi do!"),
    HammerfestQuest::new_unchecked(73, "Rapide comme l'éclair !", "As quick as the lightning!", "Rápido como el rayo..."),
    HammerfestQuest::new_unchecked(74, "Maître des Bombes", "Bomb Master", "Maestro de Bombas"),
    HammerfestQuest::new_unchecked(75, "Tombeau de Tuberculoz", "Tuber's tomb", "Tumba de Tubérculo"),
  ]
};
