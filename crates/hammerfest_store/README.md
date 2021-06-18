# `etwin_hammerfest_store`

## Inputs

```
<user> (any)
ShortHammerfestUser

<shop> (/shop.html)
(ShortHammerfestUser, HammerfestShop)

<profile> (/user.html/$USER)
HammerfestProfile

<inventory> (/user.html/inventory)
(ShortHammerfestUser, HashMap<HammerfestItemId, u32>)

<godChildren> (/user.html/godChildren)
(ShortHammerfestUser, Vec<HammerfestGodchild>)

<forumTheme> (/forum.html/theme/$THEME/)
HammerfestForumThemePage

<forumThread> (/forum.html/thread/$THREAD/)
HammerfestForumThreadPage
```

## Permanent data

```
hammerfest_servers(hammerfest_server;)
hammerfest_users(hammerfest_server, hammerfest_user_id, username)
hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id; title, description, is_public)
hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id)
hammerfest_items(hammerfest_item_id; is_hidden)
hammerfest_quests(hammerfest_quest_id;)

hammerfest_item_count_maps(hammerfest_item_count_map_id; _sha3_256)
hammerfest_item_count_map_items(hammerfest_item_count_map_id, hammerfest_item_id; count)
hammerfest_quest_status_maps(hammerfest_quest_status_map_id; _sha3_256)
hammerfest_quest_status_map_items(hammerfest_quest_status_map_id, hammerfest_quest_id; status)
hammerfest_unlocked_item_sets(hammerfest_unlocked_item_set_id; _sha3_256)
hammerfest_unlocked_item_set_items(hammerfest_unlocked_item_set_id, hammerfest_item_id;)
```

## Archive Shards

```
<profile(logged) + shop + godChildren + inventory>
hammerfest_tokens(hammerfest_server, hammerfest_user_id; tokens);

<shop>
hammerfest_shops(hammerfest_server, hammerfest_user_id; weekly_tokens, purchased_tokens, has_quest_bonus);

<godChildren>
hammerfest_godchild_lists(hammerfest_server, hammerfest_user_id; godchild_count);
hammerfest_godchildren(hammerfest_server, hammerfest_user_id, offset_in_list; godchild_id, tokens);

<profile>
hammerfest_profiles(hammerfest_server, hammerfest_user_id; best_score, best_level, season_score, quest_statuses, unlocked_items)

<profile(logged)>
hammerfest_emails(hammerfest_server, hammerfest_user_id; email)

<profile + forumThread>
hammerfest_user_achievements(hammerfest_server, hammerfest_user_id; has_carrot, ladder_level)

<inventory>
hammerfest_inventories(hammerfest_server, hammerfest_user_id; item_counts);

<forumTheme>
hammerfest_forum_theme_counts(hammerfest_server, hammerfest_theme_id; page_count, sticky_thread_count)
hammerfest_forum_theme_regular_thread_lists(hammerfest_server, hammerfest_theme_id, page; regular_thread_count)
# Thread meta only found in the theme page
hammerfest_forum_thread_theme_meta(hammerfest_server, hammerfest_thread_id, page, is_sticky, offset_in_list; latest_message_at, author_, reply_count)

<forumTheme + forumThread>
# Thread meta found both in the thread list and thread itself
hammerfest_forum_thread_shared_meta(hammerfest_server, hammerfest_thread_id; title, is_closed, page_count)

<forumTheme + forumThread>
hammerfest_forum_roles(hammerfest_server, hammerfest_user_id; role)

<forumThread>
hammerfest_forum_thread_page_counts(hammerfest_server, hammerfest_thread_id, page; message_count)
hammerfest_forum_messages(hammerfest_server, hammerfest_thread_id, page, offset_in_list; author, posted_at, remote_html_body)

<forumThread(moderator)>
hammerfest_forum_message_ids(hammerfest_server, hammerfest_thread_id, page, offset_in_list; hammerfest_message_id)

<forumThread>
hammerfest_best_season_ranks(hammerfest_server, hammerfest_user_id; best_season_rank)
```
