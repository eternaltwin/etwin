COMMENT ON SCHEMA public IS '{"version": "V004"}';

CREATE TABLE public.twinoid_users
(
  -- User ID on the Twinoid server
  user_id INT PRIMARY KEY NOT NULL,
  -- Twinoid name
  name    VARCHAR(50)     NOT NULL
);

-- Active links between Eternal-Twin and Twinoid users
CREATE TABLE public.twinoid_user_links
(
  -- Eternal-Twin user id
  user_id         UUID         NOT NULL,
  -- User ID on the Twinoid server
  twinoid_user_id INT          NOT NULL,
  -- Link creation time
  ctime           TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (user_id, twinoid_user_id),
  CONSTRAINT twinoid_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT twinoid_user_link__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cancelled links between Eternal-Twin and Twinoid users
CREATE TABLE public.old_twinoid_user_links
(
  -- Eternal-Twin user id
  user_id         UUID NOT NULL,
  -- Twinoid user id
  twinoid_user_id INT  NOT NULL,
  start_time      TIMESTAMP(3),
  end_time        TIMESTAMP(3),
  PRIMARY KEY (user_id, twinoid_user_id),
  CONSTRAINT twinoid_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT twinoid_user_link__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
