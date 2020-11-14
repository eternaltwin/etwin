# typed: strict
# frozen_string_literal: true

module Etwin
  module User
    # Eternal-Twin user display name with metadata
    class UserDisplayNameVersion
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(UserDisplayName) }
      attr_reader :value

      sig(:final) { params(value: UserDisplayName).void }
      def initialize(value)
        @value = T.let(value, UserDisplayName)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when UserDisplayNameVersion
          @value == other.value
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@value].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'value' => @value.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'value='
            pp.pp @value
          end
          pp.breakable ''
        end
      end

      class << self
        extend T::Sig

        sig(:final) { params(json_str: String).returns(T.attached_class) }
        def from_json(json_str)
          deserialize JSON.parse(json_str)
        end

        sig(:final) { params(raw: T.untyped).returns(T.attached_class) }
        def deserialize(raw)
          value = UserDisplayName.new(raw['value'])
          new(value)
        end
      end
    end
  end
end
