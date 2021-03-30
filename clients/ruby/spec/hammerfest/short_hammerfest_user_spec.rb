# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Hammerfest::ShortHammerfestUser do
  items = SerializationTestItem.from_test_dir(
    'core/hammerfest/short-hammerfest-user',
    {
      'demurgos' => Etwin::Hammerfest::ShortHammerfestUser.new(
        Etwin::Hammerfest::HammerfestServer::HfestNet,
        Etwin::Hammerfest::HammerfestUserId.new('205769'),
        Etwin::Hammerfest::HammerfestUsername.new('Demurgos')
      ),
      'elseabora' => Etwin::Hammerfest::ShortHammerfestUser.new(
        Etwin::Hammerfest::HammerfestServer::HammerfestFr,
        Etwin::Hammerfest::HammerfestUserId.new('127'),
        Etwin::Hammerfest::HammerfestUsername.new('elseabora')
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Hammerfest::ShortHammerfestUser.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
