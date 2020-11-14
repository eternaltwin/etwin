# typed: false
# frozen_string_literal: true

RSpec.describe Etwin::Twinoid::ShortTwinoidUser do
  items = SerializationTestItem.from_test_dir(
    'twinoid/short-twinoid-user',
    {
      'demurgos' => Etwin::Twinoid::ShortTwinoidUser.new(
        Etwin::Twinoid::TwinoidUserId.new('38'),
        Etwin::Twinoid::TwinoidUserDisplayName.new('Demurgos')
      )
    }
  )

  items.each do |item|
    it "reads #{item.name}" do
      actual = Etwin::Twinoid::ShortTwinoidUser.from_json(item.json)
      expect(actual).to eq(item.value)
    end
  end
end
