# typed: strict
# frozen_string_literal: true

module Etwin
  module User
    # Potentially multi-valued Eternal-Twin user display name
    class UserDisplayNameVersions
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(UserDisplayNameVersion) }
      attr_reader :current

      sig(:final) { params(current: UserDisplayNameVersion).void }
      def initialize(current)
        @current = T.let(current, UserDisplayNameVersion)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when UserDisplayNameVersions
          @current == other.current
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@current].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'current' => @current.as_json
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
            pp.text 'current='
            pp.pp @current
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
          current = UserDisplayNameVersion.deserialize(raw['current'])
          new(current)
        end
      end
    end
  end
end
