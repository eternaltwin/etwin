# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Link::HammerfestLink do # rubocop:disable Metrics/BlockLength
  items = SerializationTestItem.from_test_dir(
    'link/hammerfest-link',
    {
      'demurgos' => Etwin::Link::HammerfestLink.new(
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
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Link::HammerfestLink.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
