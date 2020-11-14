# typed: strict
# frozen_string_literal: true

module Etwin
  module Hammerfest
    # Hammerfest user reference with username
    class ShortHammerfestUser
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(HammerfestServer) }
      attr_reader :server

      sig(:final) { returns(HammerfestUserId) }
      attr_reader :id

      sig(:final) { returns(HammerfestUsername) }
      attr_reader :username

      sig(:final) { params(server: HammerfestServer, id: HammerfestUserId, username: HammerfestUsername).void }
      def initialize(server, id, username)
        @server = T.let(server, HammerfestServer)
        @id = T.let(id, HammerfestUserId)
        @username = T.let(username, HammerfestUsername)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when ShortHammerfestUser
          @server == other.server && @id == other.id && @username == other.username
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@server, @id, @username].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'server' => @server.serialize,
          'id' => @id.as_json,
          'username' => @username.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp) # rubocop:disable Metrics/MethodLength
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'server='
            pp.pp @server
            pp.text ','
            pp.breakable ''
            pp.text 'id='
            pp.pp @id
            pp.text ','
            pp.breakable ''
            pp.text 'username='
            pp.pp @username
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
          server = HammerfestServer.deserialize(raw['server'])
          id = HammerfestUserId.new(raw['id'])
          username = HammerfestUsername.new(raw['username'])
          new(server, id, username)
        end
      end
    end
  end
end
