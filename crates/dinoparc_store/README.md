# `etwin_dinoparc_store`

## Inputs

```
<inventory> (/?a=inventory)
SessionUser, Vec<InventoryItem>

<dinoz> (/?a=dino;id=$DINOZ)
SessionUser, DinoparcDinoz

<exchangeWith> (/?a=bill;uid=$USER)
SessionUser, ShortDinoparcUser, Vec<ShortDinoparcDinozWithLevel>
```

## Permanent data

```
dinoparc_servers(dinoparc_server;)
dinoparc_users(dinoparc_server, dinoparc_user_id, username;)
dinoparc_locations(dinoparc_location_id;)

dinoparc_item_count_maps(dinoparc_item_count_map_id; _sha3_256)
dinoparc_item_count_map_items(dinoparc_item_count_map_id, dinoparc_item_id; count)
dinoparc_skill_level_maps(dinoparc_skill_level_map_id; _sha3_256)
dinoparc_skill_level_map_items(dinoparc_skill_level_map_id, dinoparc_skill; dinoparc_skill_level)
```

## Archive Shards

```
<inventory + dinoz + exchangeWith>
dinoparc_coins(dinoparc_server, dinoparc_user_id; coins);
dinoparc_dinoz_names(dinoparc_server, dinoparc_dinoz_id; name);
dinoparc_dinoz_owners(dinoparc_server, dinoparc_dinoz_id; owner);
dinoparc_dinoz_locations(dinoparc_server, dinoparc_dinoz_id; location);

<dinoz + exchangeWith>
dinoparc_dinoz_levels(dinoparc_server, dinoparc_dinoz_id; loc);

<inventory>
dinoparc_inventories(dinoparc_server, dinoparc_user_id; item_counts);

<dinoz>
dinoparc_dinoz_profiles(dinoparc_server, dinoparc_dinoz_id; race, skin, life, level, experience, danger, in_tournament, elements, skills);

<exchangeWith>
dinoparc_bills(dinoparc_server, dinoparc_user_id; bills);
```

## Note

The Dinoz list requires special handling. The sidebar displays only the first
150 Dinoz. If the player has 151 Dinoz or more, the full list is only available
in the `exchangeWith` section.

If the player has 149 Dinoz or less, we can always snapshot the whole list.
If the player has 150 Dinoz, we cannot be sure that the sidebar contains the
whole list.

Because of this, if the player has 150 Dinoz in the sidebar, we ignore the
sidebar list.
