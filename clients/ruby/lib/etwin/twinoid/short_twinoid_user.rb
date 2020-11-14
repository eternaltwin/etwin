# typed: strict
# frozen_string_literal: true

module Etwin
  module Twinoid
    # Twinoid user reference with enough data to display it
    class ShortTwinoidUser
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(TwinoidUserId) }
      attr_reader :id

      sig(:final) { returns(TwinoidUserDisplayName) }
      attr_reader :display_name

      sig(:final) { params(id: TwinoidUserId, display_name: TwinoidUserDisplayName).void }
      def initialize(id, display_name)
        @id = T.let(id, TwinoidUserId)
        @display_name = T.let(display_name, TwinoidUserDisplayName)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when ShortTwinoidUser
          @id == other.id && @display_name == other.display_name
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@id, @display_name].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'id' => @id.as_json,
          'display_name' => @display_name.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)  # rubocop:disable Metrics/MethodLength
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'id='
            pp.pp @id
            pp.text ','
            pp.breakable ''
            pp.text 'display_name='
            pp.pp @display_name
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
          id = TwinoidUserId.new(raw['id'])
          display_name = TwinoidUserDisplayName.new(raw['display_name'])
          new(id, display_name)
        end
      end
    end
  end
end
