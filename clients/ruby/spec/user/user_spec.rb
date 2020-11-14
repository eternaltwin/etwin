# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::User::User do  # rubocop:disable Metrics/BlockLength
  items = SerializationTestItem.from_test_dir(
    'user/user',
    {
      'demurgos' => Etwin::User::User.new(
        Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
        Etwin::User::UserDisplayNameVersions.new(
          Etwin::User::UserDisplayNameVersion.new(
            Etwin::User::UserDisplayName.new('Demurgos')
          )
        ),
        true,
        Etwin::Link::VersionedLinks.new(
          Etwin::Link::VersionedHammerfestLink.new(nil, []),
          Etwin::Link::VersionedHammerfestLink.new(
            Etwin::Link::HammerfestLink.new(
              Etwin::Link::LinkAction.new(
                Time.utc(2017, 5, 25, 23, 12, 50, 0),
                Etwin::User::ShortUser.new(
                  Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
                  Etwin::User::UserDisplayNameVersions.new(
                    Etwin::User::UserDisplayNameVersion.new(
                      Etwin::User::UserDisplayName.new('Demurgos')
                    )
                  )
                )
              ),
              nil,
              Etwin::Hammerfest::ShortHammerfestUser.new(
                Etwin::Hammerfest::HammerfestServer::HammerfestFr,
                Etwin::Hammerfest::HammerfestUserId.new('127'),
                Etwin::Hammerfest::HammerfestUsername.new('elseabora')
              )
            ),
            []
          ),
          Etwin::Link::VersionedHammerfestLink.new(
            Etwin::Link::HammerfestLink.new(
              Etwin::Link::LinkAction.new(
                Time.utc(2017, 5, 25, 23, 13, 12, 0),
                Etwin::User::ShortUser.new(
                  Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
                  Etwin::User::UserDisplayNameVersions.new(
                    Etwin::User::UserDisplayNameVersion.new(
                      Etwin::User::UserDisplayName.new('Demurgos')
                    )
                  )
                )
              ),
              nil,
              Etwin::Hammerfest::ShortHammerfestUser.new(
                Etwin::Hammerfest::HammerfestServer::HfestNet,
                Etwin::Hammerfest::HammerfestUserId.new('205769'),
                Etwin::Hammerfest::HammerfestUsername.new('Demurgos')
              )
            ),
            []
          ),
          Etwin::Link::VersionedTwinoidLink.new(
            Etwin::Link::TwinoidLink.new(
              Etwin::Link::LinkAction.new(
                Time.utc(2020, 10, 26, 18, 53, 14, 493_000),
                Etwin::User::ShortUser.new(
                  Etwin::User::UserId.new('9f310484-963b-446b-af69-797feec6813f'),
                  Etwin::User::UserDisplayNameVersions.new(
                    Etwin::User::UserDisplayNameVersion.new(
                      Etwin::User::UserDisplayName.new('Demurgos')
                    )
                  )
                )
              ),
              nil,
              Etwin::Twinoid::ShortTwinoidUser.new(
                Etwin::Twinoid::TwinoidUserId.new('38'),
                Etwin::Twinoid::TwinoidUserDisplayName.new('Demurgos')
              )
            ),
            []
          )
        )
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::User::User.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
